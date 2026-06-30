# Cartola Viewer

> Privacy-first PDF bank statement analyzer for Chilean banks — runs entirely in your browser.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white&style=flat-square)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white&style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8?logo=tailwindcss&logoColor=white&style=flat-square)
![Zero Backend](https://img.shields.io/badge/backend-none-22c55e?style=flat-square)

Upload a bank statement PDF, get an instant spending dashboard — no server, no account, no data ever leaves your machine.

---

## Screenshots

<!-- Add a GIF or screenshot here showing the upload → dashboard flow -->
> *Demo GIF coming soon*

---

## Features

- **PDF parsing** — extracts transactions from Banco Falabella Chile statements using `pdfjs-dist`; handles both 2-amount and 3-amount line formats and Chilean locale numbers (`1.234.567`)
- **AI auto-categorization** — on upload, sends transaction descriptions to a local Llama 3.2 model via [Ollama](https://ollama.com); nothing hits the internet
- **Rule-based fallback** — 60+ hardcoded Chilean merchants (Copec, Jumbo, Cruz Verde, Netflix…) categorize instantly without needing AI
- **Merchant normalization** — two-tier alias system: community bundle + user-defined; maps legal entity names to friendly display names (`WALMART CHILE` → `Lider`)
- **Full override system** — per-transaction or bulk-by-prefix category overrides, persisted across sessions
- **Spending dashboard** — pie chart with amounts + %, month-over-month bar chart, budget planner with alerts
- **Zero backend** — all state in `localStorage`; no login, no cloud sync, no tracking

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | React 19 | Concurrent rendering; fits interactive PDF-upload flow |
| Language | TypeScript 5.9 | Strict types across parser → store → UI |
| Build | Vite 8 | Fast HMR; native ESM; PDF worker config |
| Styling | Tailwind CSS v4 | Zero config via `@tailwindcss/vite`; no PostCSS setup |
| State | Zustand 5 | Minimal boilerplate for a single-store app |
| Charts | Recharts 3 | Composable chart primitives; easy tooltip customization |
| PDF | pdfjs-dist 5 | Browser-native PDF text extraction |
| Local AI | Ollama + Llama 3.2 | On-device inference; no API keys, no data egress |

---

## Architecture

```
PDF file
  → pdfText.ts          (pdfjs-dist → raw text string)
  → parseFalabella.ts   (text → ParsedRow[], initial category via rules.ts)
  → merchants.ts        (resolveMerchant → friendly display name, display-only)
  → useCartola.ts       (Zustand store → MonthData[] → localStorage)
```

**Key design decisions:**

- **No backend by design.** Financial data is sensitive. `localStorage` was chosen deliberately — all state stays in the browser, and there is no API to leak from.
- **Two-pass categorization.** The parser applies rule-based categorization synchronously; the AI pass runs asynchronously after parse completes and patches the store. This keeps the UI responsive and lets fallback rules handle common cases instantly.
- **Category overrides are layered.** `catOverride` (single transaction) → prefix overrides (bulk, by `desc.slice(0,20)`) → `cat` (auto-assigned at parse time). `effectiveCategory(t)` always resolves the correct layer.
- **Merchant aliases are display-only.** `resolveMerchant()` returns a `displayName` for the UI but never mutates `Transaction.cat`. Categorization and display are fully decoupled.

---

## Getting Started

**Prerequisites:** Node 20+, and [Ollama](https://ollama.com) with `llama3.2` pulled (optional — the app works without it, AI categorization is skipped gracefully).

```bash
# Clone and install
git clone https://github.com/Helmutdo/plata.git
cd plata
npm install

# Pull the AI model (optional)
ollama pull llama3.2

# Start dev server
npm run dev        # → http://localhost:5173
```

```bash
npm run build      # Production build (tsc + vite)
npm run lint       # ESLint
npm run preview    # Preview dist/
```

Upload any cartola PDF from **Banco Falabella Chile** and you'll get a full dashboard in seconds.

---

## Project Structure

```
src/
├── components/       # UI components (dashboard, charts, modals)
├── data/             # communityMerchants.ts — bundled Chilean merchant DB (~60 entries)
├── lib/
│   ├── aiCategorize.ts     # Ollama / Llama 3.2 integration
│   ├── parseFalabella.ts   # PDF text → transaction rows
│   ├── merchants.ts        # Merchant alias resolution
│   ├── rules.ts            # Rule engine + autoCategorizeFallback
│   └── storage.ts          # localStorage read/write helpers
├── store/
│   └── useCartola.ts       # Single Zustand store
└── types/
    └── index.ts            # Shared types (Transaction, MonthData, CategoryTree…)
```

---

## Roadmap

| Milestone | Status | Goal |
|---|---|---|
| M1 — "Me sirve" | ✅ Complete | Parse, categorize, and visualize one month without friction |
| M2 — "Puedo mostrarlo" | 🔲 Next | A friend can use it without help (error UX, tests, export/import) |
| M3 — "Puedo compartirlo" | 🔲 Planned | Mobile responsive, deploy to GitHub Pages / Vercel |
| M4 — "Más bancos" | 🔲 Planned | `BankParser` interface + BCI / BancoEstado parsers |

See [`ROADMAP.md`](./ROADMAP.md) for the full task breakdown.

---

## Privacy

All data is stored in your browser's `localStorage` under `cartola:*` keys. Nothing is ever sent to a server — not the PDF, not your transactions, not the AI requests (Ollama runs locally). Clear everything at any time from the app header.

---

## Author

**Helmut** · [@Helmutdo](https://github.com/Helmutdo)
