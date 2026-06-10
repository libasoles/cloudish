# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture and Agent Rules

- **CRITICAL:** Use git worktrees for ALL development. Never edit files directly in main branch. Create a worktree with `git worktree add --track -b <branch-name> .claude/worktrees/<name> origin/main`, then work in that directory. This prevents accidentally losing work or disrupting ongoing changes.
- **IMPORTANT:** Before making any code changes or proposing new features, you MUST read and strictly follow the definitions and patterns established in `AGENTS.md`.
- All agent logic, base prompts, and response structures must align with the standards defined in `AGENTS.md`.
- Consistency with the existing agent architecture is a top priority.
- Keep `src/App.tsx` focused on canvas orchestration and state wiring — do not bloat it with UI logic.
- Before committing: run `npm run lint`.
- Avoid `setState` synchronously inside `useEffect`; prefer render-time derivation.
- **NEVER** use `git reset --hard` on main. If you need to revert, use `git revert` to create a new commit. This preserves history and prevents data loss.

## Project Overview

AWS architecture visualization tool built on React Flow. Users drag AWS services onto a canvas and assemble network topologies with VPCs, subnets, and 100+ AWS service nodes. Supports EN/ES i18n.

## File Structure

```
src/
├── App.tsx                      # Canvas orchestration, state, drag-drop, parent-child logic
├── main.tsx                     # Entry point
├── index.css                    # Tailwind v4 + CSS custom properties (dark-mode design tokens)
├── i18n.ts                      # EN/ES locale strings
├── components/
│   ├── AwsServiceNode.tsx       # AWS service node (icon + label + handles)
│   ├── AwsServiceIcon.tsx       # Icon renderer with CDN + fallback badge
│   ├── NetworkContainerNode.tsx # VPC/Subnet resizable container
│   ├── DragDropSidebar.tsx      # Left sidebar with draggable service tools
│   ├── ServiceSearch.tsx        # Search panel with keyboard navigation
│   └── ui/                      # shadcn/ui primitives (alert, button, card, input, select)
├── data/
│   ├── aws-services.ts          # 100+ service catalog (id, name, slug, category, description)
│   ├── aws-service-fields.ts    # Config fields per service (text/select/boolean/number)
│   └── initial-flow.ts          # Initial graph state
├── lib/
│   ├── drag-tools.ts            # Drag-and-drop encoding/decoding helpers
│   └── utils.ts                 # cn() from clsx + tailwind-merge
├── config/
│   └── aws-category-styles.ts   # Color mapping for AWS categories
└── types/
    └── flow.ts                  # Core TypeScript interfaces
```

## Node Types

Two registered custom node types:

| Type | Component | Description |
|---|---|---|
| `awsService` | `AwsServiceNode` | Individual AWS service with icon, label, and connection handles |
| `networkContainer` | `NetworkContainerNode` | VPC or Subnet — resizable via `NodeResizeControl`, color-coded |

No custom edge types — uses React Flow defaults.

## State Management

Pure React Flow state — no Redux or Zustand:
- `useNodesState()` / `useEdgesState()` from `@xyflow/react`
- Node config values stored in `node.data.fields` as `Record<string, string | boolean | number>`
- Parent-child nesting expressed via `node.parentId`

Key algorithms in `App.tsx`:
- `getAbsolutePosition()` — recursively resolves nested coordinates
- `findIntersectingContainer()` — detects VPC/subnet overlap for auto-nesting
- `syncNodeSubnet()` — reparents nodes on drag based on spatial intersection

## TypeScript Types (`src/types/flow.ts`)

```typescript
type AppNode = Node | AwsServiceNodeType | NetworkContainerNodeType
type NetworkContainerType = "subnet" | "vpc"
type SubnetType = "Public" | "Private"

type AwsServiceNodeData = {
  name: string; slug: string; category: AwsCategory
  serviceId?: string; description?: string
  fields?: Record<string, string | boolean | number>
}

type NetworkContainerNodeData = {
  containerType: NetworkContainerType; label: string; subnetType?: SubnetType
}
```

## AWS Domain

- **10 categories:** Compute, Storage, Database, Networking, Security, Analytics, ML/AI, Developer Tools, Management, Messaging
- **Icons:** CDN at `https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/{slug}/default.svg` with abbreviation fallback
- **Topology:** VPC → Subnet → Service (three-level nesting via `parentId`)

## Styling

- Tailwind CSS v4 + CSS custom properties in `index.css`
- Dark mode only (HSL design tokens in `:root`)
- AWS category colors: `bg-aws-compute`, `text-aws-storage`, etc.
- Conditional classes via `cn()` (`clsx` + `tailwind-merge`)

## Commands

```bash
npm run dev       # Start dev server with HMR
npm run build     # Type-check then bundle (tsc -b && vite build)
npm run lint      # Run ESLint
npm run preview   # Serve the dist/ build locally
```

No test runner is configured. Playwright is installed but not set up.

## Key Dependencies

- `@xyflow/react` v12 — React Flow graph engine
- `react` v19
- `@radix-ui/react-select` — Accessible select primitive
- `lucide-react` — Icons
- `tailwindcss` v4 (Vite plugin)
- `typescript` v6, `vite` v8
