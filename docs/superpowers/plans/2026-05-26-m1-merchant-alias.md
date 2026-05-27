# M1 — MerchantAlias Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar capa de normalización de comercios que mapea razones sociales bancarias a nombres conocidos por el usuario, con flujo de 2 pasos en el modal de categorización.

**Architecture:** Nueva entidad `MerchantAlias` en types. `lib/merchants.ts` expone `resolveMerchant()` (display-only, no toca el pipeline de categorización). El store Zustand administra solo aliases de usuario; `COMMUNITY_MERCHANTS` es una constante bundleada en `src/data/communityMerchants.ts`. `CategoryEditorModal` pasa a un flujo de 2 pasos: (1) identificar comercio → (2) elegir categoría.

**Tech Stack:** React 19, TypeScript, Zustand 5, localStorage, Tailwind v4

---

## ⚡ Tracks paralelos

Este plan tiene **3 tracks** que corren en paralelo. Leer el diagrama de dependencias antes de arrancar.

```
Track A (Codex)    ──────────────── sin deps ──→ [A1] Fix build  [A2] Fix lint  [A3] Community data
Track B (Gemini)   ──────────────── sin deps ──→ [B1] README
Track Main (tú)    → [1] Types → [2] merchants.ts → [3] storage → [4] store → [5] Table → [6] Modal → [7] Manager → [8] App
                                      ↑ depende de A3 (structure definida en Task 3, Codex solo llena el array)
```

**Bloqueos reales:**
- Track Main Task 2 (`merchants.ts`) necesita que Task A1 (fix build) esté completo para poder `npm run build` y verificar.
- Track Main Task 3 (`communityMerchants.ts`) define la estructura; Codex Task A3 llena el array de datos — pueden correr en paralelo si Codex ve la estructura antes de terminar.

---

## 📁 Mapa de archivos

| Archivo | Acción | Responsabilidad |
|---------|--------|----------------|
| `src/types/index.ts` | Modificar | +`MerchantAlias` interface |
| `src/lib/merchants.ts` | Crear | `matchesMerchant`, `resolveMerchant` |
| `src/data/communityMerchants.ts` | Crear | Constante COMMUNITY_MERCHANTS (~80 entries) |
| `src/lib/storage.ts` | Modificar | +`loadMerchants`, `saveMerchants`, +key en `clearAll` |
| `src/store/useCartola.ts` | Modificar | +`merchants` state, +3 acciones CRUD, +hydrate |
| `src/components/TransactionTable.tsx` | Modificar | Mostrar `displayName` en columna descripción |
| `src/components/CategoryEditorModal.tsx` | Modificar | Flujo 2 pasos: comercio → categoría |
| `src/components/MerchantManager.tsx` | Crear | UI CRUD de aliases de usuario |
| `src/App.tsx` | Modificar | +`<MerchantManager />` |
| `src/lib/parseFalabella.ts` | Modificar (Codex) | Fix `Category` → `SubCategory` línea 1 |

---

## TRACK A — Codex

### Task A1: Fix build

**Files:**
- Modify: `src/lib/parseFalabella.ts:1`

- [ ] **Step 1: Abrir el archivo y corregir el import**

```ts
// ANTES (línea 1):
import type { Category } from '../types'

// DESPUÉS:
import type { SubCategory } from '../types'
```

- [ ] **Step 2: Corregir el uso del tipo en la misma función**

Buscar en `parseFalabella.ts` cualquier uso de `Category` (no `SubCategory`) y reemplazar. La única ocurrencia debe ser en la definición de `ParsedRow`:

```ts
// ANTES:
export interface ParsedRow {
  fecha: string
  desc: string
  cargo: number
  abono: number
  month: string
  cat: Category   // ← cambiar esto
}

// DESPUÉS:
export interface ParsedRow {
  fecha: string
  desc: string
  cargo: number
  abono: number
  month: string
  cat: SubCategory
}
```

- [ ] **Step 3: Verificar que el build pasa**

```bash
npm run build
```

Esperado: sin errores TypeScript. Output en `dist/`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/parseFalabella.ts
git commit -m "fix: resolve Category type import in parseFalabella"
```

---

### Task A2: Fix lint

**Files:**
- `node_modules/` (reinstalar)
- `.gitignore` (verificar que `node_modules` está ignorado)

- [ ] **Step 1: Limpiar y reinstalar dependencias**

```bash
rm -rf node_modules package-lock.json
npm install
```

- [ ] **Step 2: Verificar lint**

```bash
npm run lint
```

Esperado: 0 errores. Si hay warnings de TypeScript sin usar, ignorar por ahora.

- [ ] **Step 3: Commit si hubo cambios en package-lock.json**

```bash
git add package-lock.json
git commit -m "chore: reinstall deps to fix eslint module resolution"
```

---

### Task A3: Community merchants data

> Requisito: leer la estructura de `src/data/communityMerchants.ts` una vez que el Track Main crea Task 3 (estructura del archivo). Codex llena el array `ENTRIES` sin tocar la función `seed`.

**Files:**
- Modify: `src/data/communityMerchants.ts` (solo el array `ENTRIES`)

- [ ] **Step 1: Llenar el array ENTRIES con merchants chilenos reales**

Reemplazar el contenido del array `ENTRIES` en `src/data/communityMerchants.ts` con este listado completo:

```ts
const ENTRIES: CommunityEntry[] = [
  // ── Supermercados ──────────────────────────────────────────────────────────
  { displayName: 'Lider',        patterns: ['WALMART CHILE', 'WAL-MART', 'LIDER'],            defaultCategory: 'Supermercado' },
  { displayName: 'Jumbo',        patterns: ['CENCOSUD RETAIL JUMBO', 'JUMBO'],                defaultCategory: 'Supermercado' },
  { displayName: 'Santa Isabel', patterns: ['CENCOSUD RETAIL SANTA', 'SANTA ISABEL'],         defaultCategory: 'Supermercado' },
  { displayName: 'Unimarc',      patterns: ['SMU S.A', 'SMU SA', 'UNIMARC'],                  defaultCategory: 'Supermercado' },
  { displayName: 'Tottus',       patterns: ['TOTTUS', 'FALABELLA TOTTUS'],                    defaultCategory: 'Supermercado' },
  { displayName: 'Acuenta',      patterns: ['ACUENTA'],                                       defaultCategory: 'Supermercado' },

  // ── Retail / Tiendas ───────────────────────────────────────────────────────
  { displayName: 'Falabella',    patterns: ['FALABELLA RETAIL', 'SAGA FALABELLA'],            defaultCategory: 'Ropa' },
  { displayName: 'Paris',        patterns: ['CENCOSUD RETAIL PARIS', 'PARIS'],                defaultCategory: 'Ropa' },
  { displayName: 'Ripley',       patterns: ['COMERCIAL ECCSA', 'RIPLEY'],                     defaultCategory: 'Ropa' },
  { displayName: 'H&M',          patterns: ['H&M', 'H AND M'],                               defaultCategory: 'Ropa' },
  { displayName: 'Zara',         patterns: ['ZARA'],                                          defaultCategory: 'Ropa' },
  { displayName: 'Corona',       patterns: ['CORONA LTDA', 'CORONA S.A'],                    defaultCategory: 'Ropa' },
  { displayName: 'Forus',        patterns: ['FORUS'],                                         defaultCategory: 'Calzado' },

  // ── Combustible ────────────────────────────────────────────────────────────
  { displayName: 'Copec',        patterns: ['COPEC'],                                         defaultCategory: 'Bencina' },
  { displayName: 'Shell',        patterns: ['SHELL'],                                         defaultCategory: 'Bencina' },
  { displayName: 'Petrobras',    patterns: ['PETROBRAS'],                                     defaultCategory: 'Bencina' },
  { displayName: 'Enex',         patterns: ['ENEX'],                                          defaultCategory: 'Bencina' },

  // ── Delivery / Comida ──────────────────────────────────────────────────────
  { displayName: 'Rappi',        patterns: ['RAPPI'],                                         defaultCategory: 'Delivery' },
  { displayName: 'PedidosYa',    patterns: ['PEDIDOSYA', 'PEDIDOS YA'],                       defaultCategory: 'Delivery' },
  { displayName: 'Uber Eats',    patterns: ['UBEREATS', 'UBER EATS'],                         defaultCategory: 'Delivery' },

  // ── Transporte ─────────────────────────────────────────────────────────────
  { displayName: 'Uber',         patterns: ['UBER'],                                          defaultCategory: 'Taxi / Uber' },
  { displayName: 'Cabify',       patterns: ['CABIFY'],                                        defaultCategory: 'Taxi / Uber' },
  { displayName: 'inDriver',     patterns: ['INDRIVER'],                                      defaultCategory: 'Taxi / Uber' },

  // ── Farmacias ──────────────────────────────────────────────────────────────
  { displayName: 'Cruz Verde',   patterns: ['CRUZ VERDE', 'CRUZVERDE'],                       defaultCategory: 'Farmacia' },
  { displayName: 'Salcobrand',   patterns: ['SALCOBRAND'],                                    defaultCategory: 'Farmacia' },
  { displayName: 'Ahumada',      patterns: ['FARMACIAS AHUMADA', 'AHUMADA'],                  defaultCategory: 'Farmacia' },

  // ── Streaming / Suscripciones ──────────────────────────────────────────────
  { displayName: 'Netflix',          patterns: ['NETFLIX'],                                   defaultCategory: 'Software / Suscripción' },
  { displayName: 'Spotify',          patterns: ['SPOTIFY'],                                   defaultCategory: 'Software / Suscripción' },
  { displayName: 'Disney+',          patterns: ['DISNEY PLUS', 'DISNEY+', 'DISNEYPLUS'],      defaultCategory: 'Software / Suscripción' },
  { displayName: 'Amazon Prime',     patterns: ['AMAZON PRIME', 'AMAZON.COM'],               defaultCategory: 'Software / Suscripción' },
  { displayName: 'YouTube Premium',  patterns: ['GOOGLE YOUTUBE', 'YOUTUBE'],                defaultCategory: 'Software / Suscripción' },
  { displayName: 'Adobe',            patterns: ['ADOBE'],                                     defaultCategory: 'Software / Suscripción' },
  { displayName: 'Cursor',           patterns: ['CURSOR'],                                    defaultCategory: 'Software / Suscripción' },
  { displayName: 'Apple',            patterns: ['APPLE.COM', 'APPLE STORE', 'ITUNES'],       defaultCategory: 'Software / Suscripción' },
  { displayName: 'Microsoft',        patterns: ['MICROSOFT'],                                 defaultCategory: 'Software / Suscripción' },
  { displayName: 'Google',           patterns: ['GOOGLE'],                                    defaultCategory: 'Software / Suscripción' },
  { displayName: 'HBO Max',          patterns: ['HBO MAX', 'MAX.COM'],                        defaultCategory: 'Software / Suscripción' },
  { displayName: 'Paramount+',       patterns: ['PARAMOUNT'],                                 defaultCategory: 'Software / Suscripción' },

  // ── Telefonía / Internet ───────────────────────────────────────────────────
  { displayName: 'Entel',       patterns: ['ENTEL'],                                          defaultCategory: 'Servicios básicos' },
  { displayName: 'Claro',       patterns: ['CLARO CHILE', 'AMX CHILE'],                      defaultCategory: 'Servicios básicos' },
  { displayName: 'Movistar',    patterns: ['MOVISTAR', 'TELEFONICA'],                         defaultCategory: 'Servicios básicos' },
  { displayName: 'WOM',         patterns: ['WOM'],                                            defaultCategory: 'Servicios básicos' },
  { displayName: 'VTR',         patterns: ['VTR'],                                            defaultCategory: 'Servicios básicos' },
  { displayName: 'GTD',         patterns: ['GTD'],                                            defaultCategory: 'Servicios básicos' },

  // ── Servicios básicos / Utilidades ─────────────────────────────────────────
  { displayName: 'Servipag',    patterns: ['SERVIPAG'],                                       defaultCategory: 'Servicios básicos' },
  { displayName: 'Chilectra',   patterns: ['CHILECTRA', 'ENEL'],                              defaultCategory: 'Servicios básicos' },
  { displayName: 'Aguas Andinas', patterns: ['AGUAS ANDINAS'],                               defaultCategory: 'Servicios básicos' },
  { displayName: 'Metrogas',    patterns: ['METROGAS'],                                       defaultCategory: 'Servicios básicos' },
  { displayName: 'CGE',         patterns: ['CGE DISTRIBUCION', 'CGE'],                        defaultCategory: 'Servicios básicos' },

  // ── Salud ──────────────────────────────────────────────────────────────────
  { displayName: 'Banmédica',   patterns: ['BANMEDICA'],                                      defaultCategory: 'Médico' },
  { displayName: 'Isapre Cruz Blanca', patterns: ['CRUZ BLANCA'],                            defaultCategory: 'Médico' },
  { displayName: 'Fonasa',      patterns: ['FONASA'],                                         defaultCategory: 'Médico' },

  // ── Educación ──────────────────────────────────────────────────────────────
  { displayName: 'Duoc UC',     patterns: ['DUOC'],                                           defaultCategory: 'Colegio / Universidad' },
  { displayName: 'Udemy',       patterns: ['UDEMY'],                                          defaultCategory: 'Cursos' },
  { displayName: 'Coursera',    patterns: ['COURSERA'],                                       defaultCategory: 'Cursos' },

  // ── Estacionamiento ────────────────────────────────────────────────────────
  { displayName: 'Parking Arauco', patterns: ['PARKING ARAUCO', 'ARAUCO PARKING'],           defaultCategory: 'Estacionamiento' },
  { displayName: 'Easy Park',   patterns: ['EASY PARK', 'EASYPARK'],                          defaultCategory: 'Estacionamiento' },

  // ── Ferretería / Hogar ─────────────────────────────────────────────────────
  { displayName: 'Easy',        patterns: ['EASY HOMECENTER', 'CENCOSUD EASY'],              defaultCategory: 'Ferretería' },
  { displayName: 'Sodimac',     patterns: ['SODIMAC', 'HOMECENTER'],                          defaultCategory: 'Ferretería' },
  { displayName: 'Ikea',        patterns: ['IKEA'],                                           defaultCategory: 'Ferretería' },

  // ── Gateways (requieren revisión manual) ───────────────────────────────────
  { displayName: '⚠️ Webpay (revisar)',      patterns: ['WEBPAY'],        defaultCategory: undefined },
  { displayName: '⚠️ Transbank (revisar)',   patterns: ['TRANSBANK'],     defaultCategory: undefined },
  { displayName: '⚠️ MercadoPago (revisar)', patterns: ['MERCADOPAGO', 'MERCADO PAGO'], defaultCategory: undefined },
  { displayName: '⚠️ Flow (revisar)',        patterns: ['FLOW.CL', 'GETFLOW'], defaultCategory: undefined },
]
```

- [ ] **Step 2: Verificar que TypeScript compila sin errores**

```bash
npm run build
```

Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/data/communityMerchants.ts
git commit -m "feat(data): add ~60 Chilean community merchants"
```

---

## TRACK B — Gemini Flash Lite

### Task B1: README real

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Reemplazar README con contenido real del producto**

```markdown
# Cartola Viewer

Herramienta local para visualizar y entender tus cartolas de Banco Falabella Chile.

Todo ocurre en tu navegador — no hay servidor, no se envían datos a ningún lado.

## ¿Qué hace?

- Extrae movimientos de PDFs de cartolas Banco Falabella
- Categoriza gastos automáticamente (supermercado, bencina, delivery, etc.)
- Muestra gráficos de gasto por categoría y por mes
- Detecta alertas de gasto inusual
- Permite crear presupuestos por categoría
- Aprende a reconocer comercios por su nombre conocido (no su razón social)

## Cómo usar

1. Abre la app en tu navegador
2. Arrastra o selecciona un PDF de tu cartola Banco Falabella
3. Los movimientos aparecen automáticamente categorizados
4. Haz clic en cualquier categoría para corregirla o asignar un nombre de comercio conocido

## Privacidad

Los datos solo se guardan en `localStorage` de tu navegador. No hay base de datos, no hay backend, no hay red.

Para borrar todo: botón "Limpiar datos" en la cabecera.

## Bancos soportados

| Banco | Estado |
|-------|--------|
| Banco Falabella | ✅ Soportado |
| Otros | Próximamente |

## Desarrollo local

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build de producción
npm run lint     # verificar código
```

## Limitaciones conocidas

- Solo soporta cartolas descargadas desde la web de Banco Falabella (formato PDF oficial)
- El parser puede fallar si Falabella cambia el formato del PDF
- TRANSBANK/WEBPAY aparece como "revisar" porque puede representar cualquier comercio
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: replace Vite template README with real product docs"
```

---

## TRACK MAIN — tú

### Task 1: Agregar MerchantAlias a types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Agregar la interface MerchantAlias**

En `src/types/index.ts`, agregar después de la línea `export type CategoryTree = CategoryDefinition[]`:

```ts
export interface MerchantAlias {
  id: string
  displayName: string       // nombre conocido por el usuario: "Unicar"
  patterns: string[]        // strings a buscar en la desc (case-insensitive contains)
  defaultCategory?: string  // subcategoría sugerida al crear el alias
  source: 'user' | 'community'
  confidence?: number       // reservado para M4+ fuzzy matching
  createdAt: string
  updatedAt: string
}
```

- [ ] **Step 2: Verificar compilación**

```bash
npx tsc --noEmit
```

Esperado: 0 errores.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(types): add MerchantAlias interface"
```

---

### Task 2: Crear lib/merchants.ts

**Files:**
- Create: `src/lib/merchants.ts`

> ⚠️ **Orden obligatorio:** Ejecutar Task 3 (comunityMerchants.ts estructura) ANTES de esta task. El import estático de `COMMUNITY_MERCHANTS` falla si el archivo no existe.

- [ ] **Step 1: Crear el archivo**

```ts
// src/lib/merchants.ts
import type { MerchantAlias } from '../types'
import { COMMUNITY_MERCHANTS } from '../data/communityMerchants'

/**
 * Devuelve true si la descripción bancaria coincide con algún patrón del alias.
 * Comparación case-insensitive, contains.
 */
export function matchesMerchant(
  desc: string,
  alias: Pick<MerchantAlias, 'patterns'>,
): boolean {
  const lower = desc.toLowerCase()
  return alias.patterns.some((p) => lower.includes(p.toLowerCase()))
}

/**
 * Busca el MerchantAlias para una descripción bancaria.
 * Los aliases de usuario tienen prioridad sobre los de la comunidad.
 * Devuelve null si no hay match.
 *
 * IMPORTANTE: esta función es display-only.
 * No modifica Transaction.cat ni Transaction.catOverride.
 */
export function resolveMerchant(
  desc: string,
  userMerchants: MerchantAlias[],
): MerchantAlias | null {
  const userMatch = userMerchants.find((m) => matchesMerchant(desc, m))
  if (userMatch) return userMatch
  return COMMUNITY_MERCHANTS.find((m) => matchesMerchant(desc, m)) ?? null
}
```

- [ ] **Step 2: Verificar compilación**

```bash
npx tsc --noEmit
```

Esperado: 0 errores.

- [ ] **Step 3: Commit**

```bash
git add src/lib/merchants.ts
git commit -m "feat(lib): add resolveMerchant and matchesMerchant"
```

---

### Task 3: Crear src/data/communityMerchants.ts (estructura)

**Files:**
- Create: `src/data/communityMerchants.ts`

> Nota: definir la estructura aquí. Track A / Task A3 llena el array `ENTRIES`.

- [ ] **Step 1: Crear el archivo con estructura y placeholder inicial**

```ts
// src/data/communityMerchants.ts
import type { MerchantAlias } from '../types'

/** Tipo de entrada sin campos autogenerados */
type CommunityEntry = Omit<MerchantAlias, 'id' | 'createdAt' | 'updatedAt' | 'source'>

/** Genera un MerchantAlias completo a partir de una entrada parcial */
function seed(entries: CommunityEntry[]): MerchantAlias[] {
  return entries.map((e) => ({
    ...e,
    id: `community__${e.displayName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    source: 'community' as const,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }))
}

/**
 * Base bundleada de comercios chilenos comunes.
 * source = 'community'. El usuario puede crear aliases propios que las sobreescriben.
 * Codex/Track A llena este array en Task A3.
 */
const ENTRIES: CommunityEntry[] = [
  // Placeholder — Codex reemplaza esto en Task A3
  { displayName: 'Lider', patterns: ['WALMART CHILE'], defaultCategory: 'Supermercado' },
]

export const COMMUNITY_MERCHANTS: MerchantAlias[] = seed(ENTRIES)
```

- [ ] **Step 2: Verificar compilación**

```bash
npx tsc --noEmit
```

Esperado: 0 errores.

- [ ] **Step 3: Commit**

```bash
git add src/data/communityMerchants.ts
git commit -m "feat(data): add communityMerchants structure (data pending Task A3)"
```

---

### Task 4: Agregar merchant storage a storage.ts

**Files:**
- Modify: `src/lib/storage.ts`

- [ ] **Step 1: Agregar import del tipo al inicio del archivo**

En `src/lib/storage.ts`, agregar `MerchantAlias` al import existente de types:

```ts
import type { CategoryRule } from './rules'
import type { CategoryTree, MerchantAlias, MonthData, SubCategory } from '../types'
```

- [ ] **Step 2: Agregar la clave y las funciones CRUD**

Después de la línea `const CATEGORY_TREE_KEY = 'cartola_category_tree'`, agregar:

```ts
const MERCHANTS_KEY = 'cartola:merchants'
```

Después de la función `saveCategoryTree`, agregar:

```ts
// ─── Merchants ───────────────────────────────────────────────────────────────

export function loadMerchants(): MerchantAlias[] {
  try {
    const raw = localStorage.getItem(MERCHANTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as MerchantAlias[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveMerchants(merchants: MerchantAlias[]): void {
  localStorage.setItem(MERCHANTS_KEY, JSON.stringify(merchants))
}
```

- [ ] **Step 3: Agregar MERCHANTS_KEY al clearAll**

En la función `clearAll`, agregar `k === MERCHANTS_KEY` a la condición:

```ts
if (
  k === MONTHS_KEY ||
  k === BUDGETS_KEY ||
  k === PREFIX_OVERRIDES_KEY ||
  k === DISMISSED_KEY ||
  k === RULES_KEY ||
  k === CATEGORY_TREE_KEY ||
  k === MERCHANTS_KEY ||
  k.startsWith(OVERRIDE_PREFIX)
) {
```

- [ ] **Step 4: Verificar compilación**

```bash
npx tsc --noEmit
```

Esperado: 0 errores.

- [ ] **Step 5: Commit**

```bash
git add src/lib/storage.ts
git commit -m "feat(storage): add merchant CRUD and clearAll key"
```

---

### Task 5: Agregar merchants al store

**Files:**
- Modify: `src/store/useCartola.ts`

- [ ] **Step 1: Agregar imports**

En los imports de `useCartola.ts`, agregar:

```ts
import {
  // ... imports existentes ...
  loadMerchants,
  saveMerchants,
} from '../lib/storage'
import type { CategoryTree, MerchantAlias, MonthData, SubCategory, Transaction } from '../types'
```

- [ ] **Step 2: Agregar al interface CartolaState**

Dentro de `interface CartolaState`, agregar después de `categoryTree`:

```ts
merchants: MerchantAlias[]
addMerchant: (alias: Omit<MerchantAlias, 'id' | 'createdAt' | 'updatedAt'>) => void
updateMerchant: (id: string, changes: Partial<Pick<MerchantAlias, 'displayName' | 'patterns' | 'defaultCategory'>>) => void
removeMerchant: (id: string) => void
```

- [ ] **Step 3: Agregar valores iniciales**

En `create<CartolaState>((set, get) => ({`, agregar:

```ts
merchants: [],
```

- [ ] **Step 4: Actualizar hydrate para cargar merchants**

En la función `hydrate`, agregar carga de merchants:

```ts
hydrate: () => {
  const months = loadAllMonths()
  const budgets = loadBudgets()
  const rules = loadRules()
  const categoryTree = loadCategoryTree()
  const merchants = loadMerchants()          // ← agregar
  const keys = months.map(monthKeyOf).filter(Boolean).sort()
  set({
    months,
    budgets,
    rules,
    categoryTree,
    merchants,                               // ← agregar
    selectedMonthKey:
      get().selectedMonthKey && keys.includes(get().selectedMonthKey!)
        ? get().selectedMonthKey
        : (keys[keys.length - 1] ?? null),
  })
},
```

- [ ] **Step 5: Agregar las 3 acciones CRUD**

Después de la acción `setCategoryTree`, agregar:

```ts
addMerchant: (alias) => {
  const now = new Date().toISOString()
  const m: MerchantAlias = {
    ...alias,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }
  const merchants = [...get().merchants, m]
  saveMerchants(merchants)
  set({ merchants })
},

updateMerchant: (id, changes) => {
  const merchants = get().merchants.map((m) =>
    m.id === id ? { ...m, ...changes, updatedAt: new Date().toISOString() } : m,
  )
  saveMerchants(merchants)
  set({ merchants })
},

removeMerchant: (id) => {
  const merchants = get().merchants.filter((m) => m.id !== id)
  saveMerchants(merchants)
  set({ merchants })
},
```

- [ ] **Step 6: Verificar compilación**

```bash
npx tsc --noEmit
```

Esperado: 0 errores.

- [ ] **Step 7: Commit**

```bash
git add src/store/useCartola.ts
git commit -m "feat(store): add merchants state and CRUD actions"
```

---

### Task 6: Mostrar displayName en TransactionTable

**Files:**
- Modify: `src/components/TransactionTable.tsx`

- [ ] **Step 1: Agregar imports**

En los imports de `TransactionTable.tsx`, agregar:

```ts
import { resolveMerchant } from '../lib/merchants'
```

- [ ] **Step 2: Obtener merchants del store**

Dentro del componente `TransactionTable`, junto al `useCartola` existente, agregar:

```ts
const merchants = useCartola((s) => s.merchants)
```

- [ ] **Step 3: Mostrar displayName en la fila**

Reemplazar el bloque del `<tr>` que renderiza la descripción. Buscar este fragmento:

```tsx
<td className="max-w-[280px] truncate px-3 py-2 text-slate-200" title={t.desc}>
  {t.desc}
</td>
```

Reemplazar por:

```tsx
<td className="max-w-[280px] truncate px-3 py-2 text-slate-200" title={t.desc}>
  {(() => {
    const merchant = resolveMerchant(t.desc, merchants)
    return merchant ? (
      <span>
        <span className="text-slate-100">{merchant.displayName}</span>
        <span className="ml-1 text-xs text-slate-500">{t.desc.slice(0, 20)}…</span>
      </span>
    ) : (
      t.desc
    )
  })()}
</td>
```

- [ ] **Step 4: Verificar que el build pasa**

```bash
npm run build
```

Esperado: sin errores.

- [ ] **Step 5: Commit**

```bash
git add src/components/TransactionTable.tsx
git commit -m "feat(ui): show merchant displayName in TransactionTable"
```

---

### Task 7: Refactorizar CategoryEditorModal con flujo 2 pasos

**Files:**
- Modify: `src/components/CategoryEditorModal.tsx`

- [ ] **Step 1: Reemplazar el contenido completo del archivo**

```tsx
// src/components/CategoryEditorModal.tsx
import { useState } from 'react'
import { resolveMerchant } from '../lib/merchants'
import { useCartola } from '../store/useCartola'
import { effectiveCategory, getMainCategory, type Transaction } from '../types'

export function CategoryEditorModal({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const applyDesc = useCartola((s) => s.applyCategoryToDesc)
  const applyOne = useCartola((s) => s.applyCategoryToTransaction)
  const categoryTree = useCartola((s) => s.categoryTree)
  const merchants = useCartola((s) => s.merchants)
  const addMerchant = useCartola((s) => s.addMerchant)
  const updateMerchant = useCartola((s) => s.updateMerchant)

  const existingMerchant = resolveMerchant(tx.desc, merchants)

  // Si ya hay un merchant resuelto, saltar al paso 2 directamente
  const [step, setStep] = useState<1 | 2>(existingMerchant ? 2 : 1)
  const [merchantName, setMerchantName] = useState(existingMerchant?.displayName ?? '')
  const [sel, setSel] = useState<string>(() => effectiveCategory(tx))

  const current = effectiveCategory(tx)
  const auto = tx.cat
  const mainCat = categoryTree.find((c) => c.subcategories.some((s) => s.name === sel))
  const dotColor = mainCat?.color ?? '#94a3b8'

  /** Guarda merchant si el usuario ingresó un nombre, luego llama applyFn */
  function handleSave(applyFn: () => void) {
    const name = merchantName.trim()
    if (name) {
      const pattern = tx.desc.slice(0, 30)
      if (existingMerchant && existingMerchant.source === 'user') {
        updateMerchant(existingMerchant.id, { displayName: name, defaultCategory: sel })
      } else if (!existingMerchant || existingMerchant.source === 'community') {
        addMerchant({ displayName: name, patterns: [pattern], defaultCategory: sel, source: 'user' })
      }
    }
    applyFn()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cat-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">

        {/* ── Paso 1: identificar comercio ── */}
        {step === 1 && (
          <>
            <h2 id="cat-modal-title" className="text-lg font-semibold text-slate-100">
              ¿Qué comercio es este?
            </h2>
            <p className="mt-2 break-words text-xs text-slate-500" title={tx.desc}>
              {tx.desc}
            </p>

            <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Nombre del comercio
            </label>
            <input
              type="text"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setStep(2)}
              placeholder="Ej: Unicar, Cruz Verde, Netflix…"
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-500/50"
              autoFocus
            />

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
              >
                Continuar →
              </button>
              <button
                type="button"
                onClick={() => { setMerchantName(''); setStep(2) }}
                className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-400 hover:bg-slate-700"
              >
                Omitir
              </button>
              <button type="button" onClick={onClose} className="ml-auto rounded-lg px-3 py-2 text-sm text-slate-500 hover:text-slate-200">
                Cancelar
              </button>
            </div>
          </>
        )}

        {/* ── Paso 2: elegir categoría ── */}
        {step === 2 && (
          <>
            <h2 id="cat-modal-title" className="text-lg font-semibold text-slate-100">
              {merchantName ? `Categoría — ${merchantName}` : 'Categoría del movimiento'}
            </h2>
            <p className="mt-2 break-words text-sm text-slate-400" title={tx.desc}>
              {tx.desc}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Automática: <span className="text-slate-300">{auto}</span>
              {tx.catOverride ? (
                <> · Manual: <span className="text-amber-300">{tx.catOverride}</span></>
              ) : null}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Vista actual: <span className="font-medium text-slate-200">{current}</span>
            </p>

            {!existingMerchant && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="mt-2 text-xs text-slate-500 hover:text-amber-400"
              >
                ← Volver a identificar comercio
              </button>
            )}

            <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Categoría
            </label>
            <select
              value={sel}
              onChange={(e) => setSel(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              {categoryTree.map((cat) => (
                <optgroup key={cat.id} label={cat.name}>
                  {cat.subcategories.map((sub) => (
                    <option key={sub.id} value={sub.name}>{sub.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>

            <div className="mt-2 flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: dotColor }} />
              <span className="text-xs text-slate-500">
                {getMainCategory(sel, categoryTree)} › {sel}
              </span>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => handleSave(() => applyDesc(tx.desc, sel))}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
              >
                Aplicar a todos los movimientos de este comercio
              </button>
              <button
                type="button"
                onClick={() => handleSave(() => applyOne(tx.id, sel))}
                className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
              >
                Solo este movimiento
              </button>
              <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-slate-200">
                Cancelar
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```

Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/components/CategoryEditorModal.tsx
git commit -m "feat(ui): 2-step merchant identification flow in CategoryEditorModal"
```

---

### Task 8: Crear MerchantManager

**Files:**
- Create: `src/components/MerchantManager.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
// src/components/MerchantManager.tsx
import { useState } from 'react'
import { useCartola } from '../store/useCartola'
import type { MerchantAlias } from '../types'

function MerchantRow({
  merchant,
  onUpdate,
  onRemove,
}: {
  merchant: MerchantAlias
  onUpdate: (id: string, changes: Partial<Pick<MerchantAlias, 'displayName' | 'patterns' | 'defaultCategory'>>) => void
  onRemove: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(merchant.displayName)
  const [patterns, setPatterns] = useState(merchant.patterns.join(', '))

  function save() {
    const trimmedName = name.trim()
    const trimmedPatterns = patterns
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
    if (!trimmedName || trimmedPatterns.length === 0) return
    onUpdate(merchant.id, { displayName: trimmedName, patterns: trimmedPatterns })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="rounded-lg border border-amber-700/40 bg-slate-800/60 p-3 text-sm">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-2 w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-1.5 text-slate-100 outline-none focus:ring-2 focus:ring-amber-500/50"
          placeholder="Nombre del comercio"
        />
        <input
          value={patterns}
          onChange={(e) => setPatterns(e.target.value)}
          className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-1.5 text-slate-100 outline-none focus:ring-2 focus:ring-amber-500/50"
          placeholder="Patrones separados por coma"
        />
        <p className="mt-1 text-xs text-slate-500">Separar patrones con coma. Se busca como substring (case-insensitive).</p>
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={save} className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500">
            Guardar
          </button>
          <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-700">
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 bg-slate-800/40 px-3 py-2 text-sm">
      <div className="min-w-0">
        <p className="font-medium text-slate-200">{merchant.displayName}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500" title={merchant.patterns.join(' | ')}>
          {merchant.patterns.join(' · ')}
        </p>
        {merchant.defaultCategory && (
          <p className="mt-0.5 text-xs text-amber-400/70">{merchant.defaultCategory}</p>
        )}
      </div>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded px-2 py-1 text-xs text-slate-400 hover:bg-slate-700 hover:text-slate-200"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm(`¿Eliminar alias "${merchant.displayName}"?`)) onRemove(merchant.id)
          }}
          className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-red-900/40 hover:text-red-300"
        >
          Eliminar
        </button>
      </div>
    </div>
  )
}

export function MerchantManager() {
  const merchants = useCartola((s) => s.merchants)
  const updateMerchant = useCartola((s) => s.updateMerchant)
  const removeMerchant = useCartola((s) => s.removeMerchant)

  const userMerchants = merchants.filter((m) => m.source === 'user')

  if (userMerchants.length === 0) return null

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-300">
        Comercios guardados ({userMerchants.length})
      </h3>
      <div className="flex flex-col gap-2">
        {userMerchants.map((m) => (
          <MerchantRow
            key={m.id}
            merchant={m}
            onUpdate={updateMerchant}
            onRemove={removeMerchant}
          />
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```

Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/components/MerchantManager.tsx
git commit -m "feat(ui): add MerchantManager component for user alias CRUD"
```

---

### Task 9: Integrar MerchantManager en App

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Agregar import**

En los imports de `App.tsx`, agregar:

```ts
import { MerchantManager } from './components/MerchantManager'
```

- [ ] **Step 2: Agregar componente en el layout**

Buscar `<RulesPanel />` en `App.tsx` y agregar `<MerchantManager />` justo después:

```tsx
<RulesPanel />
<MerchantManager />
<CategoryManager />
```

- [ ] **Step 3: Build final de M1**

```bash
npm run build
```

Esperado: sin errores, output limpio en `dist/`.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: integrate MerchantManager into App layout"
```

- [ ] **Step 5: Tag de milestone**

```bash
git tag m1-merchant-alias
git push origin main --tags
```

---

## Verificación final de M1

```bash
npm run dev
```

Checklist manual:
- [ ] Build pasa sin errores
- [ ] Lint pasa sin errores (`npm run lint`)
- [ ] Subir un PDF de Banco Falabella — transacciones aparecen
- [ ] "Lider" aparece en TransactionTable en lugar de "WALMART CHILE ..."
- [ ] Click en categoría de una transacción desconocida → aparece paso 1 "¿Qué comercio es este?"
- [ ] Ingresar nombre → continuar → elegir categoría → guardar
- [ ] La siguiente transacción del mismo comercio ya muestra el displayName
- [ ] Click en categoría de transacción ya conocida → va directo al paso 2
- [ ] Sección "Comercios guardados" aparece con el alias creado
- [ ] Editar y eliminar alias funcionan
