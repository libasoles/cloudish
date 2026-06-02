# AGENTS.md

## Architecture

This is a React Flow [React Flow](https://reactflow.dev/) (`@xyflow/react`) POC to design systems using AWS services.

Prefer atomized React/JavaScript modules over large files:

- Move reusable UI into dedicated components under `src/components`.
- Move static data and initial graph state into dedicated files under `src/data`.
- Move shared types into `src/types` and cross-cutting helpers into `src/lib`.
- Avoid adding unrelated component JSX, data catalogs, or utility functions directly to `App.tsx` when a small module would keep ownership clearer.

**State management** uses the `@xyflow/react` built-in hooks:

- `useNodesState` / `useEdgesState` — own the node and edge arrays and expose change handlers
- `addEdge` — utility to append a new edge on user-initiated connections via `onConnect`

**Rendering**: `<ReactFlow>` takes `nodes`, `edges`, and three event handlers (`onNodesChange`, `onEdgesChange`, `onConnect`). The canvas fills the full viewport via an inline `100vw × 100vh` div.

**Styling**: `src/index.css` defines a CSS custom-property design system (colors, typography, shadows) with automatic dark-mode via `@media (prefers-color-scheme: dark)`. The React Flow stylesheet is imported directly in `App.tsx` from `@xyflow/react/dist/style.css`.

Don't use inline styles in JSX except for dynamic values that can't be handled via Tailwind or CSS classes (e.g., container sizes). Prefer Tailwind utility classes over CSS.

## React State

- Do not call `setState` synchronously inside `useEffect` to derive state from props, state, or render-time calculations. Prefer computing derived values during render, or update related state in the event handler that caused the change.
- Effects should synchronize with external systems, subscriptions, timers, browser APIs, or imperative libraries. If an effect only mirrors React state into more React state, redesign the state shape first.

## Internationalization (i18n)

This project supports two languages: **English (EN)** and **Spanish (ES)**.

- All user-visible text strings must be added to `src/i18n.ts` in **both** `en` and `es` locale objects.
- Never hardcode UI text in components — always reference a key from `i18n.ts`.
- When adding a new feature or UI element that contains any text, provide both the English and Spanish translations before considering the task complete.
- Key naming: use camelCase, grouped by feature (e.g., `sidebarSearch`, `canvasDropHint`).

## Container Hierarchy

The canvas models the standard AWS network topology:

```text
Region → VPC → AZ → Subnet → Service nodes
```

All containers use node type `"networkContainer"` with `data.containerType` set to `"region"`, `"vpc"`, `"az"`, or `"subnet"`.

### Nesting rules

| Child              | Valid parents         |
| ------------------ | --------------------- |
| Region             | none (top-level only) |
| VPC                | Region                |
| AZ                 | VPC or Region         |
| Subnet             | AZ or VPC             |
| Service/User nodes | anything              |

These rules are enforced in `findIntersectingContainer` in `src/lib/graph-utils.ts`. When multiple containers overlap, the most specific (deepest) ancestor wins.

### Initial sizes

Defined as named constants in `src/lib/graph-utils.ts`:

| Container | Width               | Height |
| --------- | ------------------- | ------ |
| Region    | 900                 | 600    |
| VPC       | 600                 | 400    |
| Subnet    | 320                 | 220    |
| AZ        | auto (fills parent) | auto   |

Use `REGION_STYLE`, `VPC_STYLE`, `SUBNET_STYLE` (or the legacy alias `CONTAINER_STYLE`) when constructing nodes.

### Auto-subdivision

Each container that accepts children has an editable child-count field in the Inspector:

- **Region** → `numberOfVPCs`: creates equal-width VPC columns via `buildVpcNodes()`. Resizing the Region calls `redistributeVpcNodes()`.
- **VPC** → `numberOfAZs`: creates equal-width AZ columns via `buildAzNodes()`. Resizing the VPC calls `redistributeAzNodes()`, which is followed by `redistributeSubnetNodes()` for each AZ.
- **AZ** → `numberOfSubnets`: creates equal-height Subnet rows via `buildSubnetNodes()`. Resizing the parent VPC cascades through `redistributeSubnetNodes()` for each AZ.

Auto-managed children have `draggable: false` and `extent: "parent"`. They resize fluidly with their parent and are not independently resizable.

### Child count and orphan reparenting

The Inspector displays the **actual count of real children** (both auto-managed and manually dragged), derived dynamically from `nodes.filter(n => n.parentId === selectedNode.id)` rather than a static field. This ensures the counter always reflects reality after drag-and-drop reparenting.

When the user changes the count in the Inspector:

- **Increasing**: new auto-managed children are created via `buildVpcNodes()` / `buildAzNodes()`.
- **Decreasing**: auto-managed children are removed. **Any children of the removed containers are re-parented to the removed container's parent** (e.g., if a VPC is deleted, its AZs/Subnets move to the Region). Position is converted from parent-relative to grandparent-relative: `child.position = getAbsolutePosition(child) - getAbsolutePosition(newParent)`.

### Parent-child position model

- Child node `position` is always **relative** to its direct parent.
- `getAbsolutePosition(node, nodesById, visited?)` in `src/lib/graph-utils.ts` resolves the global position by walking the `parentId` chain recursively. **Includes cycle detection** via optional `visited` Set to prevent stack overflow if circular parentId references exist.
- `getParentedPosition(position, size, nodes)` converts a global drop position to a parent-relative one (used when dropping service nodes).
- Node ordering for React Flow subflow rendering is managed by `orderNodesForSubflows()`: Region → VPC → AZ → Subnet → Services.

### Drag-and-drop reparenting

`syncNodeSubnet` in `src/components/Canvas.tsx` runs on every `onNodeDragStop`.

**For container nodes:**

- First, re-parents the dragged container itself to its valid ancestor via `findIntersectingContainer` (respecting hierarchy rules: VPC→Region, Subnet→AZ/VPC, etc.).
- Then absorbs only **service/user nodes** that fall inside the dragged container — **does not force-parent other containers** to avoid creating cycles (e.g., preventing Region from becoming a child of a dragged VPC).

**For service/user nodes:**

- Finds the most specific intersecting container and updates `parentId` and relative `position` accordingly.

Position updates handle the conversion: `node.position = absoluteNodePosition - absoluteParentPosition`.

No manual reparenting is needed — dragging a VPC into a Region will automatically set the correct relationship.

### Dropzone visual

While dragging a container over a valid parent, `onNodeDrag` (called continuously during drag) computes the potential parent via `findIntersectingContainer()` and sets `dropTargetNodeId` in the Zustand store. `NetworkContainerNode` reads this to render a green ring highlight.

`onNodeDrag` uses `useFlowStore.getState()` to fetch fresh node state instead of a potentially stale closure value, ensuring the intersection calculation uses current positions during rapid drag events.

The value is cleared on `onNodeDragStop`.

## Before Commit

- Run `npm run lint` before committing changes.
