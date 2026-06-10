---
name: cloudish-react-patterns
description: React code style, state rules, and Zustand subscription patterns for this project. Use when writing or reviewing React components, hooks, state logic, or any Zustand store interactions.
---

# React Patterns

## Code Style

- **No nested ternaries** — use `if` statements or separate JSX conditions for clarity.
- When choosing CSS classes from component state/props, prefer explicit variants (e.g. `class-variance-authority`) over long conditional class chains.

## Node Composition

- **Circular nodes compose `CircularNode`** (`src/components/nodes/CircularNode.tsx`), the single owner of circular node anatomy: wrapper, hover state, the white circle, selection ring/pulse, and all four React Flow `Handle`s with their geometry.
- Node components must **not** declare `Handle`s for circular shapes. Per-handle visuals (e.g. the customer-gateway VPN overlay) are passed via the `handleDecorations` prop — see `buildVpnHandleDecorations` in `src/components/nodes/vpn-handle-decorations.tsx`.
- `CircularNode` is icon-agnostic: pass any icon as `children` and the label through the `label` slot. Never couple it to a specific icon component.

## React State Rules

- **Never call `setState` synchronously inside `useEffect`** to derive state from props, other state, or render-time calculations.
  - Instead: compute derived values during render, or update related state in the event handler that caused the change.
- Effects are for synchronizing with **external systems**: subscriptions, timers, browser APIs, imperative libraries.
- If an effect only mirrors React state into more React state → redesign the state shape.

## Zustand Subscription Rules

Subscriptions must be as restrictive as possible to avoid unnecessary re-renders.

- **Never subscribe to the full store** in a component:
  ```tsx
  // BAD
  const state = useFlowStore()
  ```
- **Always use focused selectors** for exactly the fields/actions needed:
  ```tsx
  // GOOD
  const commitGraphChange = useFlowStore((s) => s.commitGraphChange)
  ```
- When a component needs multiple values, select only those values and use `shallow` equality for object/array selectors.
- Keep derived values **out of store selectors** — derive them in render with `useMemo`.
- Use `useFlowStore.getState()` only for imperative/event-path reads (e.g. drag handlers) where a React subscription is not needed — **not** as a shortcut to avoid broad subscriptions in render.
