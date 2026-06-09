# AGENTS.md

## Architecture and Agent Rules

- **IMPORTANT:** Before making any code changes or proposing new features, you MUST read and strictly follow the definitions and patterns established in `AGENTS.md`.
- All agent logic, base prompts, and response structures must align with the standards defined in the custom skills.
- Consistency with the existing agent architecture is a top priority.

## Custom Skills

Project-specific rules are organized as skills under `.claude/custom-skills/` (also accessible via `.agents/custom-skills/`). Each skill covers a distinct domain:

| Skill | When to use |
| --- | --- |
| `cloudish-module-architecture` | Adding files, moving code, App.tsx changes |
| `cloudish-react-patterns` | React components, hooks, state, Zustand stores |
| `cloudish-i18n` | Any user-visible text or new UI features |
| `cloudish-container-hierarchy` | Region/VPC/AZ/Subnet nodes, drag-drop, positions |
| `cloudish-ui-components` | Icon buttons, tooltips, SVG/icon usage |
| `cloudish-worktree-workflow` | Starting tasks, committing, PRs, cleanup |

**Read the relevant skill(s) before starting any task that touches those domains.**

## Skill Maintenance

When the user provides new directives, corrections, or updated preferences on any topic covered by a skill, **updating the corresponding skill is part of the task** — not optional follow-up. Apply the change and commit it together with the feature work.

## Documentation Maintenance

When creating or updating documentation, tutorials, docs screenshots, or the docs registry, read and follow the Claude docs-maintenance skill at `.claude/skills/docs-maintenance.md`.

That skill defines the expected documentation architecture, screenshot workflow, Spanish content conventions, carousel/figure usage, and the pre-commit checklist for docs work.

## Claude Code Configuration

When modifying `.claude/settings.json` (permissions, hooks, additional directories):

- **Always use relative paths** instead of absolute paths. Relative paths keep the repository portable and prevent exposing the developer's system directory structure in version control.
  - ❌ Bad: `/Users/guillermoperez/Projects/playground/nodes/cloudish-edge-inspector-docs/src`
  - ✅ Good: `../cloudish-edge-inspector-docs/src`
- Never commit sensitive information like API keys, tokens, or personal credentials in `settings.json`.
- Document any new permission rules or hooks added to `.claude/settings.json` so future agents understand their purpose.
