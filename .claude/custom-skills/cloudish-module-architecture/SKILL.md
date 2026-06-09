---
name: cloudish-module-architecture
description: File structure and module organization rules for this React Flow AWS visualization project. Use when adding new components, moving code, creating files, or deciding where logic belongs.
---

# Module Architecture

This project is a React Flow (`@xyflow/react`) platform for designing AWS architectures. Prefer atomized React/JS modules over large files.

## Where Things Go

| Content type | Location |
|---|---|
| Reusable UI components | `src/components/` |
| Static data, service catalog, initial state | `src/data/` |
| Shared TypeScript interfaces/types | `src/types/` |
| Cross-cutting helpers, pure utilities | `src/lib/` |
| AWS category color mapping | `src/config/` |

## App.tsx Rules

`App.tsx` is **canvas orchestration only** — state wiring, drag-drop handlers, parent-child logic. Do not add:
- Unrelated component JSX
- Data catalogs or service lists
- Utility functions that belong in `src/lib/`

If it makes `App.tsx` larger, it should be its own module.

## Styling Rules

- `src/index.css` defines a CSS custom-property design system (colors, typography, shadows) with dark-mode via `@media (prefers-color-scheme: dark)`.
- Import the React Flow stylesheet in `App.tsx` from `@xyflow/react/dist/style.css`.
- **No inline styles** in JSX except for dynamic values that can't be expressed via Tailwind or CSS classes (e.g. runtime container sizes).
- Prefer Tailwind utility classes over CSS.

## State Management

Built on `@xyflow/react` built-in hooks:
- `useNodesState` / `useEdgesState` — own node and edge arrays with change handlers
- `addEdge` — append new edges on `onConnect`

No Redux or Zustand for graph state — React Flow owns it.
