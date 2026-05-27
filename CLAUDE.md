# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # dev server on :5173
npm run build      # tsc -b && vite build
npm run lint       # eslint
npm run preview    # preview dist/
```

No test suite exists.

## What This Is

Browser-only (no backend) PDF reader for **Banco Falabella** (Chile) account statements ("cartolas"). Extracts transactions from PDFs, categorizes them, and visualizes spending. All data lives in `localStorage`.

## Architecture

### Data Flow

```
PDF file
  → src/lib/pdfText.ts        (pdfjs-dist → raw text string)
  → src/lib/parseFalabella.ts (text → ParsedRow[])
  → src/store/useCartola.ts   (addPdfFiles → MonthData[] → localStorage)
```

### Categorization Pipeline

`categorize(desc, rules)` in `src/lib/rules.ts`:
1. Apply user-defined rules in order (first match wins)
2. Fall back to hardcoded keyword patterns (`autoCategorizeFallback`)

Two override layers on top:
- **prefix override** — applies to all transactions whose `desc.slice(0,20)` matches (bulk re-categorize)
- **transaction override** — `catOverride` on a single `Transaction.id`

`effectiveCategory(t)` = `t.catOverride ?? t.cat` — always use this for display/aggregation.

### State

Single Zustand store: `src/store/useCartola.ts` (`useCartola`).  
Call `hydrate()` once on mount to load from localStorage. All writes go through store actions which persist automatically.

### Storage Keys (localStorage)

| Key | Content |
|-----|---------|
| `cartola:months` | `MonthData[]` (all transactions) |
| `cartola:budgets` | `BudgetMap` (cat → limit) |
| `cartola:prefixOverrides` | `Record<prefix, SubCategory>` |
| `cartola:dismissed` | dismissed alert keys |
| `cartola_rules` | `CategoryRule[]` |
| `cartola_category_tree` | `CategoryTree` |
| `override:<desc>` | legacy per-desc overrides |

### Types

- `CategoryTree` — user-editable hierarchy (main categories → subcategories), stored in localStorage; default generated on first load in `storage.ts:makeDefaultCategoryTree`
- `Transaction.cat` — auto-assigned by rules; `Transaction.catOverride` — manual override
- `SubCategory` / `MainCategory` are plain strings (dynamic, not enums)
- `getMainCategory(sub, tree)` resolves a subcategory name to its parent category

### PDF Parsing Notes

`parseFalabella.ts` handles two Falabella line formats:
- 2 amounts per line → `[amount, saldo]`; cargo vs abono determined by description keywords
- 3+ amounts per line → `[cargo, abono, saldo]`

Chilean amounts use `.` as thousands separator (e.g. `1.234.567`).

### Stack

- React 19, TypeScript, Vite 8
- Tailwind CSS v4 (via `@tailwindcss/vite` plugin, no config file)
- Zustand 5 (state)
- Recharts 3 (charts)
- pdfjs-dist 5 (PDF parsing)
- `categorizer.ts` is a shim — re-exports from `rules.ts`
