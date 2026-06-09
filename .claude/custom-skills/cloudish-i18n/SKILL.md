---
name: cloudish-i18n
description: Internationalization rules for this project (EN/ES). Use whenever adding any user-visible text, new UI features, or modifying existing labels, tooltips, or messages.
---

# Internationalization (i18n)

This project supports two languages: **English (EN)** and **Spanish (ES)**.

## Rules

- All user-visible text strings must be added to `src/i18n.ts` in **both** `en` and `es` locale objects.
- **Never hardcode UI text in components** — always reference a key from `i18n.ts`.
- When adding a new feature or UI element with any text, provide both English and Spanish translations before considering the task complete.

## Key Naming

- Use **camelCase**, grouped by feature area.
- Examples: `sidebarSearch`, `canvasDropHint`, `inspectorLabel`

## Notes

- It's OK to use the `ñ` character in Spanish translations.
- Spanish translations should be natural, not machine-translated literal renderings.

## Checklist Before Finishing

- [ ] New keys added to both `en` and `es` in `src/i18n.ts`
- [ ] No hardcoded strings in JSX
- [ ] Key names follow camelCase + feature-grouping convention
