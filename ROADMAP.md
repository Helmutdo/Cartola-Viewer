# Roadmap — Cartola Viewer

Herramienta local para entender cartolas bancarias chilenas. Sin backend, todo en `localStorage`.

Spec completo: `docs/superpowers/specs/2026-05-26-cartola-viewer-roadmap-design.md`

---

## ✅ M1 — "Me sirve" `[COMPLETO]`

**Criterio:** puedo categorizar un mes completo sin frustración.

### Hecho

- [x] **Fix build** — `Category` → `SubCategory` en `parseFalabella.ts`
- [x] **Fix lint** — reinstalar deps, ignorar `OSINT/` y `roadmap/` en eslint
- [x] **MerchantAlias type** — nueva entidad en `src/types/index.ts`
- [x] **`src/lib/merchants.ts`** — `resolveMerchant()` + `matchesMerchant()`
- [x] **`src/data/communityMerchants.ts`** — ~60 merchants chilenos bundleados
- [x] **`src/lib/storage.ts`** — `loadMerchants` / `saveMerchants` / clave en `clearAll`
- [x] **`src/store/useCartola.ts`** — `merchants` state + `addMerchant` / `updateMerchant` / `removeMerchant`
- [x] **`TransactionTable`** — muestra `displayName` del merchant en columna descripción
- [x] **`CategoryEditorModal`** — flujo 2 pasos: (1) ¿qué comercio? → (2) ¿qué categoría?
- [x] **`MerchantManager`** — nuevo componente CRUD de aliases de usuario
- [x] **`App.tsx`** — integra `MerchantManager`
- [x] **`README.md`** — documentación real del producto (reemplaza template Vite)

---

## 🔲 M2 — "Puedo mostrarlo"

**Criterio:** un amigo puede usarlo sin ayuda mía.

### Track Principal (tú)
- [ ] Mensajes de error específicos al cargar PDF (qué falló y por qué)
- [ ] Spinner + estado visible mientras parsea
- [ ] Pantalla onboarding primera carga
- [ ] Agrupación de transacciones similares en `CategoryEditorModal` (token overlap ≥2 palabras ≥4 chars)

### Track A — Codex
- [ ] Setup Vitest en el proyecto
- [ ] Fixtures anonimizados (texto PDF de ejemplo)
- [ ] Tests: `parseTransactionLine` (ambos formatos)
- [ ] Tests: `parseFalabella` completo
- [ ] Tests: `categorize` + `applyRules`
- [ ] Tests: `resolveMerchant` + `matchesMerchant`

> ⚠️ Track A depende de que M1 esté estable (ya lo está).

### Track B — Gemini flash-lite
- [ ] Export JSON: merchants + reglas + budgets
- [ ] Import JSON: merge con datos existentes
- [ ] Botones export/import en UI

---

## 🔲 M3 — "Puedo compartirlo"

**Criterio:** lo publico sin vergüenza.

### Track Principal (tú)
- [ ] Diseño responsive mobile
- [ ] Gráfico tendencia subcategoría entre meses
- [ ] Detección gastos recurrentes (mismo merchant ≥2 meses consecutivos, monto ±20%)
- [ ] Deploy (GitHub Pages o Vercel)

### Track A — Codex
- [ ] Expandir community DB a ~150 merchants
- [ ] Cubrir: retail, farmacias, streaming, telefonía completa
- [ ] Documentar casos especiales TRANSBANK/WEBPAY

### Track B — Gemini flash-lite
- [ ] Sección privacidad en app (qué se guarda, cómo borrar)
- [ ] `CONTRIBUTING.md` para agregar merchants a la comunidad
- [ ] Guía de uso con screenshots

---

## 🔲 M4 — "Más bancos"

**Criterio:** dos bancos funcionando con la misma UI.

### Track Principal (tú)
- [ ] Interface `BankParser` común (`src/lib/parsers/BankParser.ts`)
- [ ] Detección automática de banco por contenido PDF
- [ ] Refactor `parseFalabella` para cumplir interface
- [ ] Selector banco en `UploadZone` (fallback si no detecta)

### Track A — Codex
- [ ] Parser banco 2 (BCI o BancoEstado) + fixtures + tests
- [ ] ⚠️ **Bloqueo:** requiere interface `BankParser` definida primero

### Track B — Gemini flash-lite
- [ ] Documentar interface `BankParser`
- [ ] Tutorial "cómo agregar un banco en 5 pasos"

---

## Timeline estimado

| Milestone | Estado | Duración estimada |
|-----------|--------|-------------------|
| M1 | ✅ Completo | ~2 semanas |
| M2 | 🔲 Pendiente | ~3 semanas |
| M3 | 🔲 Pendiente | ~2 semanas |
| M4 | 🔲 Pendiente | ~3 semanas |

Con tracks paralelos: ~10 semanas total desde inicio.
