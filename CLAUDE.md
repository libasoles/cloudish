# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture and Agent Rules

- **IMPORTANT:** Before making any code changes or proposing new features, you MUST read and strictly follow the definitions and patterns established in `agents.md`.
- All agent logic, base prompts, and response structures must align with the standards defined in `agents.md`.
- Consistency with the existing agent architecture is a top priority.

## Development Patterns

- Follow the coding style used in the existing codebase.
- Refer to `agents.md` for specific naming conventions and class structures.

## Commands

```bash
npm run dev       # Start dev server with HMR
npm run build     # Type-check then bundle (tsc -b && vite build)
npm run lint      # Run ESLint
npm run preview   # Serve the dist/ build locally
```

No test runner is configured.
