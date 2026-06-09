---
name: cloudish-ui-components
description: UI component patterns for icon buttons with tooltips and SVG icon usage. Use whenever adding icon-only buttons, tooltips, or any SVG/icon assets to this project.
---

# UI Component Patterns

## Icon Buttons and Tooltips

All icon-only buttons must include a `<Tooltip>` from `@/components/ui/tooltip` so their intent is clear on hover. Never rely on the native `title` attribute.

When a button may be `disabled`, disabled buttons don't fire pointer events — the tooltip would never appear. Use a `<span className="inline-flex">` as the `TooltipTrigger` child:

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

The span receives hover events even when the button inside is disabled. Wrap the whole group in a single `<TooltipProvider>`.

## Icon Components

- **Never embed raw `<svg>` markup** directly inside feature or page components.
- Always abstract SVGs into dedicated React icon components under `src/components/icons/`.
- Reuse icon components via imports to keep visual assets centralized and easier to maintain.
