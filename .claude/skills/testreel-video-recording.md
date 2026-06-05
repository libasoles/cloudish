# Skill: Testreel Video Recording with Scenes

Use this skill when the user asks to add, modify, or create a demo video using `testreel` and Playwright in `scripts/record-demo.ts`.

---

## What this skill does

Guides Claude to generate or edit `scripts/record-demo.ts` to produce an MP4 demo video composed of sequential **scenes**. Each scene is a labeled block of Playwright actions recorded against a live dev server.

---

## Architecture at a glance

```
chromium.launch()
  └─ context.newPage()
       └─ recordPage(page, options)   ← testreel wraps the page
            ├─ Scene 1: loadApp() + Playwright actions
            ├─ Scene 2: continuation or loadApp() for fresh state
            ├─ ...
            └─ recorder.stop() → { video: './testreel-output/<name>.mp4' }
```

- `recordPage` is the only testreel import — it wraps a Playwright `Page` and returns a recorder handle.
- `recorder.stop()` must be called **before** `browser.close()` or the video will be corrupt.
- The dev server must be running before executing the script (`npm run dev` or `npm run preview`).

---

## Key constants

```typescript
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8888'
const VIEWPORT = { width: 1920, height: 1080 }
const AZ_NODE_SELECTOR  = '.react-flow__node[data-id^="az-"]'
const VPC_NODE_SELECTOR = '.react-flow__node[data-id^="vpc-"]'
```

---

## Recorder options

```typescript
const recorder = await recordPage(page, {
  chrome: true,                    // renders a browser chrome frame
  cursor: {
    style: 'circle',               // 'dot' | 'circle' | 'crosshair'
    size: 28,
    color: '#60a5fa',
    ripple: true,                  // click ripple animation
    hideWhenIdle: false,
  },
  background: {
    color: '#0a0a0a',
    padding: 40,
    borderRadius: 12,
  },
  outputFormat: 'mp4',             // 'mp4' | 'webm' | 'gif'
})
```

---

## Scene structure

Each scene is a `console.log` banner followed by Playwright actions:

```typescript
// ── Scene N — <title> ─────────────────────────────────────────
console.log('Scene N: <title>...')
await loadApp(page)              // only if fresh state is needed

// ... Playwright actions ...

await clearCanvasSelection(page)
await page.waitForTimeout(300)
```

### Fresh state vs. continuation

- Call `await loadApp(page)` at the start of a scene that needs a clean canvas.
- Omit it when the scene continues directly from the previous one (e.g. Scene 2 uses nodes placed in Scene 1).

---

## Reusable helper functions

All helpers live at the top of `record-demo.ts`. Do not duplicate them.

| Helper | Purpose |
|---|---|
| `loadApp(page)` | Navigate to `BASE_URL`, wait for React Flow pane |
| `addNodeBySidebarClick(page, index)` | Click the Nth draggable sidebar button and wait for node to appear |
| `addNodeBySidebarLabel(page, /regex/)` | Click a sidebar button by visible label text (more stable) |
| `waitForAzNodeCount(page, n)` | Wait until ≥ n AZ nodes are in the DOM |
| `getFirstAzNode(page)` | Returns `page.locator(AZ_NODE_SELECTOR).first()` |
| `firstVpcNode(page)` | Returns `page.locator(VPC_NODE_SELECTOR).first()` |
| `clickContainerHeader(page, node)` | Click the header area of a container node (bbox offset x+44, y+18) |
| `positionNodeAt(page, index, x, y)` | Drag node by DOM index to absolute viewport coords |
| `positionNodeLocatorAt(page, locator, x, y)` | Drag a locator-resolved node to absolute coords |
| `clearCanvasSelection(page)` | Press Escape + click empty area to deselect |
| `addClickIndicator(page, x, y)` | Inject a pulsing blue ring at (x, y) for visual emphasis |
| `removeClickIndicator(page)` | Remove the injected indicator |
| `addMouseCursor(page, x, y)` | Inject a synthetic macOS cursor SVG |
| `removeMouseCursor(page)` | Remove the injected cursor |

---

## Stable node reference pattern

After adding a node, reference it by the count captured **before** adding it, not by text content (text can be ambiguous):

```typescript
const countBefore = await page.locator('.react-flow__node').count()
await addNodeBySidebarLabel(page, /^Subred$/i)
await page.waitForTimeout(500)
const newNode = page.locator('.react-flow__node').nth(countBefore)
```

---

## Adding a new scene — step by step

1. **Decide where in `main()`** to add it. Scenes run sequentially, top to bottom.

2. **Add the scene block:**
   ```typescript
   // ── Scene 6 — <Your title> ─────────────────────────────────────────────
   console.log('Scene 6: <Your title>...')
   await loadApp(page) // omit if continuing from previous scene

   // Place your Playwright actions here
   // Use helpers above instead of raw locator chains

   await clearCanvasSelection(page)
   await page.waitForTimeout(300)
   ```

3. **Use label-based selectors over index-based** when the sidebar item has a stable visible label. This survives sidebar reordering:
   ```typescript
   await addNodeBySidebarLabel(page, /^EC2$/i)    // good
   await addNodeBySidebarClick(page, 8)            // fragile if sidebar order changes
   ```

4. **Wait for DOM state before referencing nodes:**
   ```typescript
   await vpcNode.waitFor({ state: 'visible', timeout: 8000 })
   await waitForAzNodeCount(page, 2)
   ```

5. **Update the top-of-file Scenes comment:**
   ```typescript
   /**
    * Scenes:
    * 1. ...
    * 6. <Your title> ~Xs
    */
   ```

---

## Running the script

```bash
# Terminal 1 — start the app
npm run dev

# Terminal 2 — record
npm run demo

# Output lands in:
#   ./testreel-output/<timestamp>.mp4
```

`npm run demo` is defined in `package.json` as:
```json
"demo": "tsx scripts/record-demo.ts"
```

If it doesn't exist yet, add it and ensure `tsx` and `testreel` are installed:
```bash
npm install --save-dev testreel tsx
```

---

## .gitignore

`testreel-output/` and `*.webm` are already ignored. Do not commit generated video files.

---

## Common pitfalls

| Problem | Fix |
|---|---|
| Video is corrupt / empty | `recorder.stop()` was called after `browser.close()` — always stop before closing |
| Node reference is wrong element | Use count-before-add pattern, not text filter |
| Slider / checkbox not found | Add `await element.waitFor({ state: 'visible', timeout: 8000 })` before interacting |
| AZ nodes not ready after slider | Use `waitForAzNodeCount(page, n)` instead of a fixed timeout |
| Sidebar click adds wrong node | Switch to `addNodeBySidebarLabel` with a label regex |
| Container header click misses | Use `clickContainerHeader(page, node)` which accounts for the header offset |
