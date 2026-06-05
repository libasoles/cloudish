# Skill: Designing AWS Architecture Diagrams on the Canvas

Use this skill whenever the user asks to model, draw, or update an AWS architecture in `src/data/initial-flow.ts`, or when adding new services to the catalog (`src/data/aws-services.ts`).

---

## What this skill covers

- How to write valid node and edge objects for `initial-flow.ts`
- Container nesting rules (Region → VPC → AZ → Subnet → ASG → Service)
- Layout heuristics: minimize edge crossings, fill space, no overlap
- Correct `sourceHandle`/`targetHandle` per spatial relationship
- How to add a new service to the catalog and give it a circular render

---

## Node data model

Two registered custom node types:

### `awsService` — individual service card

```typescript
{
  id: "unique-id",
  type: "awsService",
  position: { x: number, y: number },   // relative to parent if parentId is set
  data: {
    name: string,        // display label
    slug: string,        // CDN icon path segment (see aws-services.ts)
    category: AwsCategory,
    serviceId?: string,  // controls special render variants (see below)
    description?: string,
  },
  parentId?: string,     // omit for top-level nodes
  extent?: "parent",     // always set when parentId is present
}
```

### `networkContainer` — VPC, AZ, subnet, ASG, region

```typescript
{
  id: "unique-id",
  type: "networkContainer",
  position: { x: number, y: number },
  style: { width: number, height: number },  // required — no auto-sizing
  data: {
    containerType: "region" | "vpc" | "az" | "subnet" | "asg",
    label: string,
    subnetType?: "Public" | "Private",   // only for containerType: "subnet"
  },
  parentId?: string,
  extent?: "parent",
}
```

---

## Container nesting hierarchy

```
region  (top-level, no parentId)
└─ vpc  (parentId: region)
   ├─ awsService nodes at VPC level (e.g. IGW, ALB)
   ├─ az  (parentId: vpc)
   │  ├─ subnet Public  (parentId: az)
   │  │  └─ awsService  (e.g. NAT Gateway)
   │  └─ subnet Private  (parentId: az)
   │     ├─ asg  (parentId: subnet)
   │     │  └─ awsService  (e.g. EC2)
   │     └─ awsService  (e.g. RDS, ElastiCache)
   └─ az  (parentId: vpc)
      └─ ... (same structure)
```

**Node array order matters** — parents must appear before children. Follow top-down declaration order.

---

## Circular render variant

Nodes with these `serviceId` values render as a circle (56 px diameter) instead of a card:

- `"internet-gateway"`
- `"nat-gateway"`
- `"vpn-gateway"`

Circular node actual rendered size: **56 px wide × ~90 px tall** (circle + label).  
Regular card node: **~80 px wide × ~80 px tall** (icon + label, `min-w-20`).

To add a new circular service:
1. Add it to `AWS_SERVICES` in `src/data/aws-services.ts`
2. Add its `serviceId` to the `isCircular` check in `src/components/AwsServiceNode.tsx`

---

## Layout heuristics (from user feedback — apply every time)

### 1. Minimize edge crossings
- Trace every edge mentally before committing to positions.
- "Support" services accessed by many nodes (S3, CloudWatch) go **below** the region, not to the right. Edges going down don't cross the horizontal main flow.
- Keep the main request flow in one dominant direction (usually left→right or top→bottom). Don't introduce back-edges.

### 2. Correct connector direction
**The user's rule — never leave handles unset:**

| Relative position | `sourceHandle` | `targetHandle` |
|---|---|---|
| A is to the LEFT of B | `"right"` | `"left"` |
| A is to the RIGHT of B | `"left"` | `"right"` |
| A is ABOVE B | `"bottom"` | `"top"` |
| A is BELOW B | `"top"` | `"bottom"` |

When both horizontal and vertical offsets exist, pick the **dominant direction** (larger delta).  
`NetworkContainerNode` has no explicit handles — omit `targetHandle` for container targets.

### 3. No overlap
- Leave ≥ 40 px vertical gap between stacked nodes (e.g. IGW → ALB → AZ).
- Account for circular nodes being **~90 px tall**, not 56 px.
- Container label chips extend ~12 px **above** the container border — factor this into spacing.

### 4. Fill available space — no dead zones
- Derive heights top-down: `container_height = sum_of_children + margins`.
- If a VPC header holds IGW + ALB above AZs, allocate only the space those nodes occupy (+ 40 px margins), then start the AZs immediately after.
- Containers should look "full" — avoid large blank strips at the bottom.

### 5. Position support services for short edges
- **S3**: below the region, x-aligned with the EC2 nodes that write to it → EC2→S3 edge goes straight down.
- **CloudWatch**: below the region, x-centered between the AZs it monitors.
- **Route 53 / internet clients**: to the left of the region, y-centered with IGW/ALB they connect to.

---

## Reference layout for a 2-AZ architecture

```
Absolute positions:
  web-client:     (30,  340)
  route53:        (30,  540)
  region:         (200,  80)  — 1850 × 1010
  s3:             (570, 1155) — below region, under AZ-A
  cloudwatch:    (1160, 1155) — below region, centered between AZs

Inside region → vpc: (100, 70) — 1630 × 850
  IGW:  (787, 22)   — 56px wide, centered in AZ gap (gap center x=815)
  ALB:  (775, 155)  — 80px wide, same center; 51px below IGW bottom
  AZ-A: (30,  275)  — 730 × 540
  AZ-B: (870, 275)  — 730 × 540
  AZ gap: 110px (760→870), center at x=815

Inside each AZ:
  pub-subnet:  (20,  55) — 690 × 170
  priv-subnet: (20, 280) — 690 × 240
  NAT GW inside pub-subnet: x = (690−56)/2 = 317, y = (170−90)/2 ≈ 44

Inside priv-subnet:
  asg:          (20,  50) — 240 × 165
  EC2 in asg:   (80,  45)
  RDS:          (355, 80)
  ElastiCache:  (545, 80)   — AZ-A only; AZ-B has RDS Standby only
```

---

## Adding a new service to the catalog

1. **`src/data/aws-services.ts`** — append to the relevant category block:
   ```typescript
   { id: 'my-service', name: 'My Service', category: AWS_CATEGORIES.NETWORKING,
     slug: 'aws-res-amazon-vpc-my-service',
     description: '...', aliases: 'search terms here' },
   ```
   The `slug` is used to build the CDN icon URL. If the icon doesn't exist at the CDN, the node shows an abbreviation badge — that's acceptable.

2. **To make it circular** — add `serviceId === "my-service"` to the `isCircular` check in `src/components/AwsServiceNode.tsx`:
   ```typescript
   const isCircular =
     data.serviceId === "internet-gateway" ||
     data.serviceId === "nat-gateway"      ||
     data.serviceId === "my-service"       ||   // ← add here
     data.serviceId === "vpn-gateway";
   ```

3. The service is now searchable in the sidebar and draggable onto the canvas.

---

## Validating positions before writing

For each node, verify:
- `position.x + node_width ≤ parent_style.width - right_margin`
- `position.y + node_height ≤ parent_style.height - bottom_margin`
- No two siblings overlap (`position.x` ranges don't intersect at the same `y`)

For the VPC header strip (above AZs), confirm:
- `IGW_bottom = IGW_y + 90`
- `ALB_top = ALB_y` → gap = `ALB_y − IGW_bottom` ≥ 40
- `AZ_top = az_y` → gap = `az_y − (ALB_y + 80)` ≥ 30

---

## Running the app

```bash
npm run dev      # dev server at http://localhost:5173
npm run build    # type-check + bundle (catches type errors in initial-flow.ts)
npm run lint     # ESLint (run before committing)
```

Screenshot the canvas with Playwright (no `chromium-cli` available):
```javascript
import { chromium } from './node_modules/playwright/index.mjs';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.waitForSelector('.react-flow__renderer');
await page.waitForTimeout(3000);
// click fit-view button: document.querySelectorAll('.react-flow__controls button')[2].click()
await page.screenshot({ path: '/tmp/screenshot.png' });
await browser.close();
```
