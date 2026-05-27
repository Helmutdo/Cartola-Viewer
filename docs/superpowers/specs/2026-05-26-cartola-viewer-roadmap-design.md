# Cartola Viewer — Roadmap Design

**Fecha:** 2026-05-26  
**Producto:** Cartola Viewer — lector visual de cartolas bancarias chilenas  
**Stack:** React 19 · TypeScript · Vite · Zustand · localStorage · Tailwind v4 · Recharts · pdfjs-dist

---

## Objetivo del producto

Herramienta local y privada (sin backend) que ayuda al usuario a entender su cartola bancaria sin revisar manualmente cada movimiento. Primer banco: Banco Falabella Chile.

## Audiencia y evolución

- **Fase inicial:** uso personal — iterar rápido, validar con cartolas propias
- **Transición:** producto compartible con otros usuarios chilenos
- **Sin backend** en ninguna fase; localStorage como storage principal hasta M4 donde se evalúa IndexedDB si el volumen lo requiere

---

## Problemas actuales bloqueantes

| # | Problema | Archivo | Severidad |
|---|----------|---------|-----------|
| 1 | Build roto: `Category` no existe en types | `src/lib/parseFalabella.ts:1` | 🔴 crítico |
| 2 | Lint roto: módulo faltante en node_modules | `node_modules/eslint` | 🟡 medio |
| 3 | Sin tests | — | 🟡 medio |
| 4 | README es template Vite | `README.md` | 🟢 bajo |

---

## Nueva entidad: MerchantAlias

El problema central de UX: las cartolas muestran razones sociales legales, el usuario conoce nombres de fantasía.

```ts
interface MerchantAlias {
  id: string
  displayName: string        // nombre que el usuario reconoce: "Unicar"
  patterns: string[]         // ["MULTICAR SPA", "SOC HNOS VEHICULOS MULTICAR"]
  defaultCategory?: string   // subcategoría sugerida al crear alias
  source: 'user' | 'community'  // community = bundleado, user = creado por usuario
  confidence?: number        // reservado para fuzzy matching M4+ (no se usa en M1-M3)
  createdAt: string
  updatedAt: string
}
```

### Flujo de resolución

```
descripción cartola
  → resolveMerchant(desc, merchants)   ← lib/merchants.ts (nuevo)
  → MerchantAlias encontrado?
      sí → displayName + defaultCategory
      no → desc cruda + "Sin categorizar"
  → usuario ve displayName en UI
  → si no reconoce → modal 2 pasos:
      paso 1: "¿Qué comercio es este?" → crea/asigna MerchantAlias
      paso 2: "¿Qué categoría?" → aplica categoría
```

### Storage key nueva

`cartola:merchants` → `MerchantAlias[]`

### Base inicial bundleada (~80-150 entries)

```ts
// src/data/communityMerchants.ts
export const COMMUNITY_MERCHANTS: MerchantAlias[] = [
  { displayName: "Lider",          patterns: ["WALMART CHILE"],           source: "community", ... },
  { displayName: "Paris",          patterns: ["COMERCIAL ECCSA", "CENCOSUD RETAIL PARIS"], source: "community", ... },
  { displayName: "Jumbo",          patterns: ["CENCOSUD RETAIL JUMBO"],   source: "community", ... },
  { displayName: "Santa Isabel",   patterns: ["CENCOSUD RETAIL SANTA"],   source: "community", ... },
  { displayName: "Unimarc",        patterns: ["SMU S.A", "UNIMARC"],      source: "community", ... },
  { displayName: "Falabella",      patterns: ["FALABELLA RETAIL"],        source: "community", ... },
  { displayName: "Ripley",         patterns: ["COMERCIAL ECCSA RIPLEY"],  source: "community", ... },
  // TRANSBANK/WEBPAY → marcado como requiere revisión (gateway, no merchant)
  { displayName: "⚠️ Webpay (revisar)", patterns: ["WEBPAY", "TRANSBANK"], source: "community", defaultCategory: undefined, ... },
]
```

---

## Arquitectura de cambios

### Archivos nuevos

| Archivo | Responsabilidad |
|---------|----------------|
| `src/types/index.ts` | +`MerchantAlias` interface |
| `src/lib/merchants.ts` | `resolveMerchant()`, `matchesMerchant()` |
| `src/data/communityMerchants.ts` | JSON bundleado merchants chilenos |
| `src/components/MerchantManager.tsx` | UI CRUD de aliases del usuario |

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/lib/storage.ts` | +`loadMerchants`, `saveMerchants`, `saveMerchant` |
| `src/store/useCartola.ts` | +`merchants` state, `addMerchant`, `updateMerchant`, `removeMerchant` |
| `src/lib/parseFalabella.ts` | Fix `Category` → `SubCategory` en línea 1 |
| `src/components/TransactionTable.tsx` | Mostrar `displayName` si merchant resuelto |
| `src/components/CategoryEditorModal.tsx` | Flujo 2 pasos: comercio → categoría |
| `src/App.tsx` | Agregar `<MerchantManager />` |

### Pipeline actualizado

```
Antes:  desc → categorize() → Transaction.cat
Después: desc → resolveMerchant() → MerchantAlias?
                                      sí → displayName en UI + defaultCategory como sugerencia
                                      no → desc cruda, Sin categorizar
              → categorize() → Transaction.cat  (pipeline existente sin cambios)
```

> `resolveMerchant` es display-only. No modifica `cat` ni `catOverride`. La categoría sigue siendo responsabilidad de las reglas y overrides existentes. El `defaultCategory` del alias es solo una sugerencia en el modal.

---

## Roadmap por milestones

### M1 — "Me sirve" (~2 semanas)

**Criterio de salida:** puedo categorizar un mes completo sin frustración.

| Track | Responsable | Tareas |
|-------|-------------|--------|
| Principal | Tú | MerchantAlias completo: types + lib + storage + store + UI |
| A | Codex | Fix build + reinstalar deps + .gitignore + JSON communityMerchants |
| B | Gemini | README real + JSDoc en merchants.ts y types |

**Dependencias:** Track A no depende de nada. Track B puede arrancar en paralelo con la definición de la interface.

---

### M2 — "Puedo mostrarlo" (~3 semanas)

**Criterio de salida:** un amigo puede usarlo sin ayuda mía.

| Track | Responsable | Tareas |
|-------|-------------|--------|
| Principal | Tú | Errores útiles en upload + spinner + onboarding primera carga + agrupación similares en modal (token overlap ≥2 palabras ≥4 chars) |
| A | Codex | Setup Vitest + fixtures anonimizados + tests parser + tests categorize + tests resolveMerchant |
| B | Gemini | Export/Import JSON (merchants + reglas + budgets) + botones en UI |

**Dependencias:** Track A depende de M1 terminado (necesita `resolveMerchant` estable para testear).

---

### M3 — "Puedo compartirlo" (~2 semanas)

**Criterio de salida:** lo publico sin vergüenza.

| Track | Responsable | Tareas |
|-------|-------------|--------|
| Principal | Tú | Mobile responsive + gráfico tendencia subcategoría + detección gastos recurrentes (mismo merchant ≥2 meses consecutivos, monto ±20%) + deploy (GitHub Pages o Vercel) |
| A | Codex | Expandir community DB a ~150 merchants + casos especiales documentados |
| B | Gemini | Sección privacidad + CONTRIBUTING.md para agregar merchants + guía de uso con screenshots |

---

### M4 — "Más bancos" (~3 semanas)

**Criterio de salida:** dos bancos funcionando con la misma UI.

| Track | Responsable | Tareas |
|-------|-------------|--------|
| Principal | Tú | Interface `BankParser` + detección automática banco por PDF + refactor parseFalabella + selector banco en UploadZone |
| A | Codex | Parser banco 2 (BCI o BancoEstado) + fixtures + tests (**bloqueo:** requiere `BankParser` interface definida primero) |
| B | Gemini | Documentar `BankParser` + tutorial "cómo agregar un banco en 5 pasos" |

### Interface BankParser (M4)

```ts
interface BankParser {
  bankId: string
  bankName: string
  detect(text: string): boolean        // ¿este PDF es de este banco?
  parse(text: string): ParsedRow[]
}
```

---

## Timeline estimado

```
Semana 1-2:   M1 (paralelo 3 tracks)
Semana 3-5:   M2 (paralelo 3 tracks)
Semana 6-7:   M3 (paralelo 3 tracks)
Semana 8-10:  M4 (paralelo 3 tracks, bloqueo en A)

Total con paralelismo:  ~10 semanas
Total sin paralelismo:  ~16 semanas
```

---

## Decisiones técnicas clave

| Decisión | Elección | Razón |
|----------|----------|-------|
| `resolveMerchant` es display-only | Sí | No contamina pipeline de categorización existente |
| Community merchants bundleados en código | `src/data/communityMerchants.ts` | Sin fetch, sin backend, sin latencia |
| `source: 'user' \| 'community'` | Sí | User siempre puede sobrescribir community sin perder el original |
| TRANSBANK/WEBPAY | Marcados como "revisar" | Son gateways, no merchants — irresolubles sin contexto |
| Tests con Vitest | M2, no M1 | Primero validar que la feature funciona con uso real |
| Storage M1-M3 | localStorage | Simple, suficiente para uso personal |
| Storage M4+ | Evaluar IndexedDB | Solo si volumen multi-banco lo requiere |

---

## Agentes secundarios

- **Codex:** tareas mecánicas/datos — fixes, tests, JSON data, parsers
- **Gemini Flash Lite:** docs, README, JSDoc, export/import UI simple
- **Regla:** Codex y Gemini no tocan arquitectura core ni store — solo lib/, data/, docs/, tests/
