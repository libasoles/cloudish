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

## Code Style

- Don't use nested ternaries — prefer `if` statements for clarity, or multiple conditions for JSX.

## React State

- Do not call `setState` synchronously inside `useEffect` to derive state from props, state, or render-time calculations. Prefer computing derived values during render, or update related state in the event handler that caused the change.
- Effects should synchronize with external systems, subscriptions, timers, browser APIs, or imperative libraries. If an effect only mirrors React state into more React state, redesign the state shape first.

## Zustand Subscription Rule

- Subscriptions to Zustand stores must be as restrictive as possible to avoid unnecessary re-renders.
- Never subscribe to the full store object inside React components (for example, `const state = useFlowStore()`).
- Always use focused selectors for only the exact fields/actions needed (for example, `useFlowStore((s) => s.commitGraphChange)`).
- If a component needs multiple store values, select only those values and use `shallow` equality when returning an object/array selector.
- Keep derived values out of store selectors when possible; derive them in render with `useMemo` if needed.
- Use `useFlowStore.getState()` only for imperative/event-path reads where React subscription is not required (for example, drag handlers), not as a replacement for broad subscriptions in render.

## Internationalization (i18n)

This project supports two languages: **English (EN)** and **Spanish (ES)**.

- All user-visible text strings must be added to `src/i18n.ts` in **both** `en` and `es` locale objects.
- Never hardcode UI text in components — always reference a key from `i18n.ts`.
- When adding a new feature or UI element that contains any text, provide both the English and Spanish translations before considering the task complete.
- Key naming: use camelCase, grouped by feature (e.g., `sidebarSearch`, `canvasDropHint`).
- It's ok to use the ñ char in Spanish translations.

## Documentation Maintenance

When creating or updating documentation, tutorials, docs screenshots, or the docs registry, read and follow the Claude docs-maintenance skill at `.claude/skills/docs-maintenance.md`.

That skill defines the expected documentation architecture, screenshot workflow, Spanish content conventions, carousel/figure usage, and the pre-commit checklist for docs work.

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

## Icon Buttons and Tooltips

All icon-only buttons must include a `<Tooltip>` (from `@/components/ui/tooltip`) so their intent is clear on hover. Never rely on the native `title` attribute.

When an icon button may be `disabled`, a disabled button does not fire pointer events and the tooltip would never appear. Use a `<span className="inline-flex">` as the `TooltipTrigger` child and place the `Button` (or `PopoverTrigger asChild > Button`) inside it:

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <span className="inline-flex">
      <Button variant="ghost" size="icon" disabled={...}>
        <SomeIcon className="h-4 w-4" />
      </Button>
    </span>
  </TooltipTrigger>
  <TooltipContent side="top">{label}</TooltipContent>
</Tooltip>
```

The span receives hover events even when the button inside is disabled, so the tooltip shows. Wrap the whole group in a single `<TooltipProvider>`.

## Icon Components

- Never embed raw `<svg>` markup directly inside feature/page components.
- Always abstract SVGs into dedicated React icon components under `src/components/icons`.
- Reuse icon components via imports to keep visual assets centralized and easier to maintain.

## Before Commit

- Run `npm run lint` before committing changes.
- For tasks that touch Tailwind classes, run a class-level lint check before finishing the task (for example, warnings like `suggestCanonicalClasses`).
- Apply Tailwind class suggestions when possible only if they are low risk and do not change behavior, layout intent, or responsive/accessibility semantics.

## Worktree Isolation

All agents must work in a dedicated git worktree to avoid conflicts with other AI agents or concurrent sessions running against this repository.

- Never make changes directly on the checked-out `main` branch.
- Before starting any implementation task, create an isolated worktree on a feature branch:

  ```bash
  git worktree add ../cloudish-<feature-slug> -b feat/<feature-slug>
  ```

- All file edits, installs, and commits happen inside the worktree directory, not in the main working tree.
- When the task is complete, open a PR from the feature branch and let the human merge. Remove the worktree afterwards:

  ```bash
  git worktree remove ../cloudish-<feature-slug>
  git branch -d feat/<feature-slug>
  ```

- If another agent's worktree already exists for the same feature, coordinate with the human before creating a new one — do not overwrite in-progress work.

## Pull Requests

Creating a pull request is mandatory for every completed task, even when the change is small or the agent is allowed to approve it without human review.

- Every PR must include a clear description of what changed, why it changed, and how it was verified.
- Add relevant PR comments for future reference when implementation details, tradeoffs, follow-up work, or verification notes are useful to preserve.
- Include screenshots for UI, documentation, tutorial, or visual changes. Use before/after screenshots when they help future reviewers understand the change.
- Agents may create and approve their own PRs without waiting for review, but the PR record must still exist before the task is considered complete.
