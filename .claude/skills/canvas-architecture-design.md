# Skill: Designing AWS Architecture Diagrams on the Canvas

Use this skill whenever the user asks to model, draw, or update an AWS architecture in this tool. **Read the full skill before touching any file.**

---

## CRITICAL WORKFLOW — Follow every time

**Never bake a diagram into `src/data/initial-flow.ts`.** That file must stay empty (`[]`). The correct workflow is:

1. **Design** the diagram (nodes + edges) according to this skill's patterns.
2. **Save to Firestore** using the Admin SDK script `scripts/save-default-diagram.mjs` (see "Saving a diagram" below).
3. **Share the link** with the user: `https://cloudish-feb6a.web.app/?p={architectureId}`
4. The canvas loads saved diagrams via `?p=` URL param — empty by default.

---

## Self-update instructions

After each interaction that teaches something new about this tool or AWS design:
1. Open this file.
2. Append or refine the relevant section.
3. Save it. Do NOT create a separate file.

---

## Saving a diagram (Admin SDK script)

The script at `scripts/save-default-diagram.mjs` is the canonical way to save. To use it:

```bash
node --env-file=.env.local scripts/save-default-diagram.mjs
```

Modify the `nodes`, `edges`, `viewport`, and `ARCHITECTURE_NAME` variables at the top of the script before running.

The script:
1. Reads `FIREBASE_SERVICE_ACCOUNT_JSON_BASE64` from `.env.local`
2. Looks up the user `gperez78@gmail.com` → gets their Firebase UID
3. Writes to Firestore: `users/{uid}/architectures/{newDocId}`
4. Prints the `architectureId` and the shareable link

Resulting URL format: `https://cloudish-feb6a.web.app/?p={architectureId}`

---

## What this skill covers

- Node and edge data model for this canvas
- Container nesting rules (Region → VPC → AZ → Subnet → ASG → Service)
- Layout heuristics: minimize edge crossings, fill space, no overlap
- Correct `sourceHandle`/`targetHandle` per spatial relationship
- How to add a new service to the catalog
- AWS Well-Architected best practices to apply when composing diagrams

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

## Layout heuristics (apply every time)

### 1. Minimize edge crossings
- Trace every edge mentally before committing to positions.
- "Support" services accessed by many nodes (S3, CloudWatch) go **below** the region, not to the right. Edges going down don't cross the horizontal main flow.
- Keep the main request flow in one dominant direction (usually left→right or top→bottom). Don't introduce back-edges.

### 2. Correct connector direction
**Never leave handles unset:**

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

2. **To make it circular** — add `serviceId === "my-service"` to the `isCircular` check in `src/components/AwsServiceNode.tsx`.

3. The service is now searchable in the sidebar and draggable onto the canvas.

---

## Validating positions before writing

For each node, verify:
- `position.x + node_width ≤ parent_style.width - right_margin`
- `position.y + node_height ≤ parent_style.height - bottom_margin`
- No two siblings overlap (`position.x` ranges don't intersect at the same `y`)

---

## AWS Well-Architected Framework — design principles to apply

Source: [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html) (last updated Nov 2024)

When composing architecture diagrams, verify that the design reflects as many of these as appropriate for the use case.

### Operational Excellence
- **Implement observability**: Always include CloudWatch (or equivalent) to monitor the workload. Show it as a dashed edge to the resources it monitors.
- **Automate where possible**: Represent Auto Scaling Groups, CI/CD pipelines, and managed services — prefer ASG over standalone EC2.
- **Make frequent, small, reversible changes**: Use loosely-coupled services. Show SQS/SNS between compute and downstream consumers when decoupling is appropriate.
- **Use managed services**: Prefer RDS over self-managed DB, ElastiCache over custom cache, ALB over custom proxy.

### Security
- **Defense in depth**: Every diagram must show security at all layers — WAF/Shield at the edge, security groups at compute, VPC endpoints for AWS services.
- **Least privilege / separate tiers**: Always use public + private subnets. Never put DB or cache in a public subnet.
- **Protect data in transit and at rest**: Show KMS for RDS and S3, Secrets Manager for credentials.
- **Keep people away from data**: Show Secrets Manager or SSM Parameter Store instead of hardcoded config.
- **Minimize blast radius**: Isolate tiers — EC2 in private subnets, DB only reachable from app tier.

### Reliability
- **Multi-AZ by default**: Any production diagram must span at least 2 AZs. Duplicate compute + DB across AZs.
- **Scale horizontally**: Use ASG for compute tiers. Show ALB distributing across AZs.
- **RDS Multi-AZ replication**: Show a "Sync replication" dashed edge between primary and standby RDS nodes.
- **Recovery paths — NAT GW per AZ**: Each AZ gets its own NAT Gateway (not shared) to avoid single-point failure.
- **IGW and ALB are region-level**: They sit in the VPC header, not inside any AZ.

### Performance Efficiency
- **Go global in minutes**: For global workloads, show CloudFront in front of ALB/S3. Route 53 with latency routing for multi-region.
- **Use serverless where appropriate**: Show Lambda + API Gateway + DynamoDB for event-driven or variable-load workloads.
- **Caching**: Show ElastiCache (Redis/Memcached) between compute and DB tiers. Show CloudFront for static assets.
- **Match storage to access pattern**: S3 for objects, RDS for relational, DynamoDB for key-value at scale.

### Cost Optimization
- **Right-size**: Use ASG instead of fixed large instances. Show Spot Instances for stateless/batch workloads.
- **Match supply to demand**: Show Auto Scaling — avoid over-provisioned static resources.
- **Shared managed services**: Show ElastiCache and RDS Multi-AZ shared across AZs rather than per-instance.

### Sustainability
- **Minimize footprint**: Prefer serverless and managed services over always-on compute.
- **Maximize utilization**: Show shared services rather than per-service instances.

---

## Common architecture patterns

| Pattern | Key services to include |
|---|---|
| 3-tier web (baseline) | Route53 → ALB → EC2 (ASG) → RDS + ElastiCache; S3 for assets; CloudWatch |
| Serverless API | API Gateway → Lambda → DynamoDB; CloudWatch; Cognito for auth |
| Data pipeline | Kinesis → Lambda/Glue → S3 → Athena; CloudWatch; SNS for alerts |
| Containerized app | ALB → ECS/EKS → RDS; ECR; Secrets Manager; CloudWatch |
| Static site + API | CloudFront → S3 (static); CloudFront → API Gateway → Lambda → DynamoDB |

---

## Running the app

```bash
npm run dev      # dev server at http://localhost:5173
npm run build    # type-check + bundle
npm run lint     # ESLint (run before committing)
```

Screenshot the canvas with Playwright (pass `?p=ARCHITECTURE_ID` to load a saved diagram):
```javascript
import { chromium } from './node_modules/playwright/index.mjs';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
await page.goto('http://localhost:5173/?p=ARCHITECTURE_ID', { waitUntil: 'networkidle' });
await page.waitForSelector('.react-flow__renderer');
await page.waitForTimeout(3000);
await page.screenshot({ path: '/tmp/screenshot.png' });
await browser.close();
```
