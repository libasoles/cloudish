# Cloudish UI Interaction — Playwright Reference

Lessons learned from automated testing of the Cloudish canvas (React Flow v12).
Use this when writing verification scripts or driving the app with Playwright.

---

## Browser setup

```typescript
const browser = await chromium.launch({
  headless: false,
  slowMo: 50,
  args: ['--start-maximized'],
})
const ctx = await browser.newContext({ viewport: null }) // use full screen size
const page = await ctx.newPage()
await page.goto('http://localhost:5174', { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForSelector('.react-flow__pane', { timeout: 30000 })
await page.waitForTimeout(2000) // let HMR + React settle
```

**Why fullscreen (`--start-maximized` + `viewport: null`):**
React Flow auto-pans when dragging a node toward the canvas left edge (the
canvas starts at ~120px from viewport left due to the sidebar). With a small
viewport (1440×900), the VPC left edge can land at screen x≈90–270, which puts
drag targets within the auto-pan zone and causes nodes to fly far to the left in
flow coordinates. Fullscreen gives the canvas enough room to avoid this.

---

## Node selectors (React Flow v12)

React Flow v12 encodes the node type in a CSS class, **not** in `data-type`.

| What | Selector |
|---|---|
| Any node | `.react-flow__node` |
| Region container | `.react-flow__node[data-id^="region-"]` |
| VPC container | `.react-flow__node[data-id^="vpc-"]` |
| Internet Gateway | `.react-flow__node-gatewayService` |
| Generic AWS service | `.react-flow__node-awsService` |
| Canvas pane (empty area) | `.react-flow__pane` |

> Do **not** use `data-type="gatewayService"` — that attribute doesn't exist in v12.

---

## Adding nodes

### Via sidebar button

```typescript
const regionBtn = page.locator('aside button').filter({ hasText: /Region/i }).first()
const prev = await page.locator('.react-flow__node').count()
await regionBtn.click()
await page.waitForFunction(
  (n: number) => document.querySelectorAll('.react-flow__node').length > n,
  prev,
  { timeout: 8000 },
)
await page.waitForTimeout(1000)
```

### Via search box

The search results use `onMouseDown`, so use `dispatchEvent('mousedown')` — plain
`click()` closes the dropdown before the handler fires.

```typescript
const search = page.locator('input[placeholder]').first()
await search.click()
await search.fill('Internet Gateway')
await page.waitForTimeout(800) // wait for dropdown to render
const result = page.locator('li').filter({ hasText: /Internet Gateway/i }).first()
const prev = await page.locator('.react-flow__node').count()
await result.dispatchEvent('mousedown')
await page.waitForFunction(
  (n: number) => document.querySelectorAll('.react-flow__node').length > n,
  prev,
  { timeout: 8000 },
)
await page.keyboard.press('Escape')
await page.waitForTimeout(800)
```

---

## Dragging nodes

```typescript
async function drag(page, selector, targetX, targetY) {
  const b = await page.locator(selector).first().boundingBox()
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2) // pick from center
  await page.mouse.down()
  await page.waitForTimeout(200)
  await page.mouse.move(targetX, targetY, { steps: 20 }) // slow = more reliable
  await page.waitForTimeout(200)
  await page.mouse.up()
  await page.waitForTimeout(1500) // let layout + re-render settle
}
```

The `steps: 20` parameter matters — React Flow processes each intermediate mouse
event and fires layout recalculations; too fast and nodes land in unexpected spots.

### Targeting container edges (straddle)

To make a gateway straddle a VPC border, place the gateway **center** near the
border. The gateway is 63×104px, so `±31px` from center to edge.

| Goal | Target X |
|---|---|
| Straddle VPC left edge | `vpcBB.x - 5` (center 5px outside VPC left) |
| Straddle VPC bottom edge | `vpcBB.y + vpcBB.height - 5` (center 5px from VPC bottom) |
| Straddle VPC right edge | `vpcBB.x + vpcBB.width + 5` |
| Fully inside VPC | `vpcBB.x + vpcBB.width / 2` (VPC center) |

For **left/right edge** drags: always move the gateway to the VPC center first,
then do the short edge drag. This prevents the 500px+ long drag that triggers
viewport auto-pan.

```typescript
// Step 1: reset to VPC center
let vpcBB = await page.locator(VPC_SEL).first().boundingBox()
await drag(page, GW_SEL, vpcBB.x + vpcBB.width / 2, vpcBB.y + vpcBB.height / 2)
await page.waitForTimeout(500)
// Step 2: short drag to straddle left edge
vpcBB = await page.locator(VPC_SEL).first().boundingBox() // re-read after layout
await drag(page, GW_SEL, vpcBB.x - 5, vpcBB.y + vpcBB.height / 2)
```

---

## Container / parenting behaviour

- A node whose **center** lands inside a container is **auto-parented** to it on drop.
  Its stored `position` becomes relative to the parent.
- Gateway nodes do **not** have `extent: "parent"`, so they can straddle container
  borders (position.x or position.y can be negative relative to parent).
- `getNodeRect(node, nodesById)` resolves the **absolute** flow position for any
  node, following the parent chain — use this for geometry checks, not `node.position`.
- `VPC_PAD = 18px` — region has an 18px gap between its border and the VPC's border.
  A gateway overhanging the VPC left edge by ≤18px stays inside the region without
  needing the region to grow. Region growth triggers only when the gateway's absolute
  position exits the region's content box.

---

## Viewport / coordinate system

```
screen_x  =  flow_x * zoom  +  pan_x
screen_y  =  flow_y * zoom  +  pan_y
```

- At the default zoom (1.0) in a fresh canvas, `pan_x ≈ 108`.
- Viewport pans when you drag a node near the **canvas pane** edge (not the viewport
  edge). The canvas starts after the sidebar (~120px from viewport left).
- After a long drag that triggers auto-pan, `pan_x` shifts and subsequent `boundingBox()`
  reads reflect the new screen positions. Always re-read bbox after each drag.

### Panning the canvas (when needed)

Drag on **empty canvas area** — not on a node — to pan without moving any node.
Pick a Y coordinate that is clearly within the canvas (not over the sidebar or nodes).

```typescript
const vpcBB = await page.locator(VPC_SEL).first().boundingBox()
const emptyY = vpcBB.y + vpcBB.height + 40 // below all nodes
await page.mouse.move(600, emptyY)
await page.mouse.down()
await page.waitForTimeout(150)
await page.mouse.move(1000, emptyY, { steps: 25 }) // pan right 400px
await page.waitForTimeout(150)
await page.mouse.up()
await page.waitForTimeout(800)
```

---

## Checking containment

```typescript
function contained(inner, outer, margin = 6) {
  return (
    inner.x + margin >= outer.x &&
    inner.y + margin >= outer.y &&
    inner.x + inner.width  - margin <= outer.x + outer.width &&
    inner.y + inner.height - margin <= outer.y + outer.height
  )
}
```

Use `margin = 6` to tolerate 1px render rounding and antialiasing.

---

## Idempotency check

Click on the canvas pane a few times (not on any node) and verify the containers
don't drift. `drift < 1px` is the threshold.

```typescript
const r1 = await page.locator(REGION_SEL).first().boundingBox()
await page.locator('.react-flow__pane').click({ position: { x: 50, y: 50 } })
await page.waitForTimeout(400)
const r2 = await page.locator(REGION_SEL).first().boundingBox()
const drift = Math.abs(r1.x - r2.x) + Math.abs(r1.y - r2.y) +
              Math.abs(r1.width - r2.width) + Math.abs(r1.height - r2.height)
console.assert(drift < 1, `region drifted ${drift}px`)
```
