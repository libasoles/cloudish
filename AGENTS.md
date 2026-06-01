# AGENTS.md

## Architecture

This is a React Flow POC for [React Flow](https://reactflow.dev/) (`@xyflow/react`). Keep `src/App.tsx` focused on orchestration of the canvas, state wiring, and high-level layout.

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

## React State

- Do not call `setState` synchronously inside `useEffect` to derive state from props, state, or render-time calculations. Prefer computing derived values during render, or update related state in the event handler that caused the change.
- Effects should synchronize with external systems, subscriptions, timers, browser APIs, or imperative libraries. If an effect only mirrors React state into more React state, redesign the state shape first.
