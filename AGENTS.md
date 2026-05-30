# AGENTS.md

## React State

- Do not call `setState` synchronously inside `useEffect` to derive state from props, state, or render-time calculations. Prefer computing derived values during render, or update related state in the event handler that caused the change.
- Effects should synchronize with external systems, subscriptions, timers, browser APIs, or imperative libraries. If an effect only mirrors React state into more React state, redesign the state shape first.
