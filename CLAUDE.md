# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server with HMR
npm run build     # Type-check then bundle (tsc -b && vite build)
npm run lint      # Run ESLint
npm run preview   # Serve the dist/ build locally
```

No test runner is configured.

## Architecture

This is a single-component POC for [React Flow](https://reactflow.dev/) (`@xyflow/react`). All logic lives in `src/App.tsx`.

**State management** uses the `@xyflow/react` built-in hooks:


- `useNodesState` / `useEdgesState` — own the node and edge arrays and expose change handlers
- `addEdge` — utility to append a new edge on user-initiated connections via `onConnect`

**Rendering**: `<ReactFlow>` takes `nodes`, `edges`, and three event handlers (`onNodesChange`, `onEdgesChange`, `onConnect`). The canvas fills the full viewport via an inline `100vw × 100vh` div.

**Styling**: `src/index.css` defines a CSS custom-property design system (colors, typography, shadows) with automatic dark-mode via `@media (prefers-color-scheme: dark)`. The React Flow stylesheet is imported directly in `App.tsx` from `@xyflow/react/dist/style.css`.
