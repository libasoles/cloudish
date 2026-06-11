---
name: cloudish-container-hierarchy
description: AWS container topology, nesting rules, node sizes, auto-subdivision, position model, and drag-drop reparenting for this React Flow project. Use when working with Region, VPC, AZ, or Subnet nodes.
---

# Container Hierarchy

## Topology

```text
AWS → Region → VPC → AZ → Subnet → Service nodes
```

All containers use node type `"networkContainer"` with `data.containerType` set to `"aws"`, `"region"`, `"vpc"`, `"az"`, or `"subnet"`.

The `"aws"` container is the top-level "AWS Cloud" wrapper. It is a **simple resizable container** (like `"generic"`/`"asg"`): no auto-subdivision, no dedicated Inspector panel, resized via plain style updates in `NetworkContainerNode.handleResize`. It only constrains nesting (Region must live inside it; it cannot itself be nested). It is `searchOnly` in the sidebar catalog and rendered last in `DragDropSidebar`.

## Nesting Rules

| Child | Valid parents |
|---|---|
| AWS | none (top-level only) |
| Region | AWS only |
| VPC | Region |
| AZ | VPC or Region |
| Subnet | AZ or VPC |
| Service/User nodes | anything |

Enforced in `findIntersectingContainer` in `src/lib/graph-utils.ts`. When multiple containers overlap, the most specific (deepest) ancestor wins.

## Initial Sizes

Defined as named constants in `src/lib/graph-utils.ts`:

| Container | Width | Height |
|---|---|---|
| AWS | 1360 | 920 |
| Region | 1160 | 760 |
| VPC | 760 | 520 |
| AZ | 580 | 400 |
| Subnet | 384 | 264 |

Use `AWS_STYLE`, `REGION_STYLE`, `VPC_STYLE`, `AZ_STYLE`, `SUBNET_STYLE` (or legacy `CONTAINER_STYLE`) when constructing nodes.

## Container Spacing

Managed nested containers use a single shared inner gap constant in `src/lib/graph-utils.ts`.

- Region → VPC, VPC → AZ, and AZ → Subnet must use the same horizontal/outer spacing.
- The label/header area is separate from the content gap: content starts at `REGION_HEADER_H + CONTAINER_INNER_GAP`.
- When changing default container sizes or redistribution logic, keep `buildVpcNodes()`, `redistributeVpcNodes()`, `buildAzNodes()`, `redistributeAzNodes()`, `buildSubnetNodes()`, and `redistributeSubnetNodes()` aligned.

## Auto-Subdivision

Each container has an editable child-count field in the Inspector:

- **Region** → `numberOfVPCs`: creates equal-width VPC columns via `buildVpcNodes()`. Resizing calls `redistributeVpcNodes()`.
- **VPC** → `numberOfAZs`: creates equal-width AZ columns via `buildAzNodes()`. Resizing calls `redistributeAzNodes()` → `redistributeSubnetNodes()` for each AZ.
- **AZ** → `numberOfSubnets`: creates equal-height Subnet rows via `buildSubnetNodes()`. Resizing parent VPC cascades via `redistributeSubnetNodes()`.

Auto-managed children: `draggable: false`, `extent: "parent"`. They resize with their parent and are not independently resizable.

## Child Count and Orphan Reparenting

The Inspector shows the **actual count** of real children: `nodes.filter(n => n.parentId === selectedNode.id)` — never a static field.

When count changes in Inspector:
- **Increasing**: new auto-managed children are created.
- **Decreasing**: auto-managed children are removed. **Their children are re-parented to the removed container's parent.** Position converts from parent-relative to grandparent-relative:
  ```
  child.position = getAbsolutePosition(child) - getAbsolutePosition(newParent)
  ```

## Position Model

- Child `position` is always **relative to its direct parent**.
- `getAbsolutePosition(node, nodesById, visited?)` in `src/lib/graph-utils.ts` resolves global position by walking `parentId` recursively. Includes cycle detection via `visited` Set.
- `getParentedPosition(position, size, nodes)` converts a global drop position to parent-relative (used when dropping service nodes).
- Node ordering for React Flow subflow rendering: `orderNodesForSubflows()` → Region → VPC → AZ → Subnet → Services.

## Overlap Avoidance on Add

When a node is **added** (sidebar/search click or drop), it must not land on top of an existing node. `avoidNodeOverlap(desired, size, nodes, excludeId?)` in `src/lib/graph-utils.ts` nudges the desired **absolute** position to the nearest free spot (spiral search) before `getParentedPosition` runs. It treats only **leaf nodes** as obstacles — containers are skipped, since nodes nest inside them.

- Use `VISUAL_NODE_SIZE` (the rendered icon-node footprint), **not** `DEFAULT_NODE_WIDTH/HEIGHT` (the hit-test rect), as the collision size — otherwise tall icon nodes still overlap vertically.
- Applies to free-placed leaf nodes only: subnet-scope services, user/internet/web/mobile/database. Band/gateway/auto-distributed nodes keep their own layout logic; text and pasted images are intentionally left alone (annotations placed deliberately).
- **Drag does not avoid overlap** — `syncNodeSubnet` leaves dragged nodes where the user drops them. Overlap avoidance is initial-placement only.

## Scope Bands (non-subnet-scope services)

Services with `placementScope: "regional"` or `"vpc"` (e.g., S3, RDS, API Gateway) live in a **band** around their allowed ancestor container rather than inside the content area.

- Implementation: `src/lib/placement.ts` — `getScopeBandInsets`, `redistributeScopeBandForContainer`, `clampPositionToBand`, `computeCenteredBandPlacement`, `detectBandSideAtPosition`, `withVirtualBandMember`. (The old slot-stacking `computeBandPlacement`/`getBandNodePosition` were removed — band nodes keep the user's drop position.)
- Band sides: `"top" | "right" | "bottom" | "left"`.
  - **Sidebar drag drops**: `resolveBandSide()` = `resolveBorderSide()` (18% edge zone) `?? getPreferredBandSide()`. During drag, ALWAYS resolve against `getContentBoxRect()` (container minus insets), never the full container rect: the content box stays absolutely fixed while bands grow, so the resolved side can't oscillate from the growth it triggered.
  - **Existing-node drags** (`onNodeDrag` + the within-ancestor path of `syncNodeSubnet`) share one intent formula: `detectBandSideAtPosition()` (strip hit — precise on corners) `?? resolveBorderSide()` (18% zone of the content box) `?? (incoming ? getPreferredBandSide() : null)`. `incoming` = `node.parentId !== ancestor.id`. A `null` side means free repositioning: no highlight, no growth, drop keeps the node free-floating. Same-parent nodes can therefore only be banded via the strips/border zones — the central content area is free placement (drag gives explicit control).
  - **Click-to-add (no drag)**: `getPreferredBandSide(scope, serviceId)` only — no border proximity. Entry-point services (`EDGE_SERVICE_IDS`: api-gateway, cloudfront, route53, waf) → left; everything else → scope default (right; global → top).
- Band nodes have `data.bandSide` set; absent means free-floating inside the container.
- `BAND_NODE_SIZE = BAND_NODE_H = 80` — matches the AwsServiceNode visual dimensions (`min-w-20`, `≈80px tall`). Do NOT set this to `DEFAULT_NODE_WIDTH` (150) — that's the hit-test size, not the visual size.
- **Placement keeps the drop point**: drag drops use `clampPositionToBand()` — the drop position projected into the strip of the resolved side (cross-axis anchored just outside the content edge, the position `getScopeBandInsets` treats as the settled column). Click-to-add uses `computeCenteredBandPlacement()` — centered along the content edge, alternating outward search for a free slot (no overlap).
- Container grows outward via `redistributeScopeAffectedLayouts` after each band placement.

### Live band growth during drag

While dragging a scope-restricted service (sidebar tool OR existing node), Canvas grows the hovered container's band live so the node fits where the pointer is:

- `applyLiveBandGrowth(containerId, member, draggedNodeId?)` in Canvas.tsx: builds a patched node list via `withVirtualBandMember()` — the dragged node virtually reparented to the target container with `bandSide` = hovered side, or an appended ghost for sidebar drags — then `getScopeBandInsets` → `applyInsetResizeOnly` → `propagateBandGrowthToAncestors`. The virtual reparent is what makes growth work when the node comes from another parent / another side (its real `parentId`/`position`/`bandSide` would otherwise contribute nothing or the wrong side).
- **Bounded growth — two invariants that prevent runaway feedback loops:**
  1. The virtual member's position is the **clamped landing position** (`clampPositionToBand`), never the raw pointer position. Raw coordinates make the band chase the node outward indefinitely (the container grows under the node, the node keeps intersecting, repeat).
  2. The size source fed to the clamp MUST match what `getScopeBandInsets` measures (the `AppNode` for existing nodes, the serviceId default for ghosts). A mismatch (e.g. measured 90px vs catalog 80px) diverges by the difference on every frame.
- `releaseLiveBandGrowth(keepContainerId?, draggedNodeId?)`: shrinks the previously grown container via `redistributeScopeBandForContainer`. It first strips the dragged node's `bandSide` — the node is "in hand", and counting its live far-away position as a band member would grow the container after it instead of letting it escape. Called on every non-band exit of `onDragOver`/`onNodeDrag`, on `handleToolDragEnd` (cancelled sidebar drag), and in `onDrop` BEFORE `commitGraphChange` so the undo snapshot doesn't capture a grown empty band.
- `onNodeDragStop` does NOT release — `detectBandSideAtPosition` in `syncNodeSubnet` needs the grown insets at drop time; the final `redistributeScopeAffectedLayoutsWithPropagation` is the settle.
- `onDrop` captures `{dropTargetNodeId, dropBandSide}` as a `bandHint` before clearing highlight state and passes it to `addToolAtPosition` — after the release-shrink the drop point may fall outside the shrunk container rect.
- All live growth runs through `useFlowStore.getState().setNodes` (event path): no undo history entries.
- Testing note: `dataTransfer.getData()` is protected (returns `""`) during `dragover` even for synthetic events — sidebar drag-over relies on the `activeDragToolRef` fallback set by the button's `dragstart`. Playwright scripts must dispatch a real `dragstart` on the sidebar button before synthetic `dragover`s.

## Drag-and-Drop Reparenting

`syncNodeSubnet` in `src/components/Canvas.tsx` runs on every `onNodeDragStop`.

**For container nodes:**
1. Re-parents the dragged container to its valid ancestor via `findIntersectingContainer` (respects hierarchy rules).
2. Absorbs only **service/user nodes** inside the dragged container — does **not** force-parent other containers (prevents cycles).

**For service/user nodes:**
- Finds the most specific intersecting container, updates `parentId` and relative `position`.

Position update: `node.position = absoluteNodePosition - absoluteParentPosition`.

## Dropzone Visual

During drag, `onNodeDrag` computes the potential parent via `findIntersectingContainer()` and sets `dropTargetNodeId` in Zustand. `NetworkContainerNode` reads this to render a green ring highlight.

`onNodeDrag` uses `useFlowStore.getState()` for fresh node state (not a stale closure), ensuring correct intersection during rapid events. Cleared on `onNodeDragStop`.
