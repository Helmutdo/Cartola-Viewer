import type { CategoryRule } from './rules'
import type { CategoryTree, MerchantAlias, MonthData, SubCategory } from '../types'

const MONTHS_KEY = 'cartola:months'
const BUDGETS_KEY = 'cartola:budgets'
const OVERRIDE_PREFIX = 'override:'
const PREFIX_OVERRIDES_KEY = 'cartola:prefixOverrides'
const DISMISSED_KEY = 'cartola:dismissed'
const RULES_KEY = 'cartola_rules'
const CATEGORY_TREE_KEY = 'cartola_category_tree'
const MERCHANTS_KEY = 'cartola:merchants'

// ─── Months ─────────────────────────────────────────────────────────────────

export function saveMonthData(month: MonthData): void {
  const all = loadAllMonths()
  const key = monthKeyFromData(month)
  const idx = all.findIndex((m) => monthKeyFromData(m) === key)
  if (idx >= 0) all[idx] = month
  else all.push(month)
  all.sort((a, b) => monthKeyFromData(a).localeCompare(monthKeyFromData(b)))
  localStorage.setItem(MONTHS_KEY, JSON.stringify(all))
}

export function loadAllMonths(): MonthData[] {
  try {
    const raw = localStorage.getItem(MONTHS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as MonthData[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// ─── Category overrides (legacy per-desc / prefix) ──────────────────────────

export function saveOverride(desc: string, cat: SubCategory): void {
  localStorage.setItem(`${OVERRIDE_PREFIX}${desc}`, cat)
}

export function loadOverrides(): Record<string, SubCategory> {
  const out: Record<string, SubCategory> = {}
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k || !k.startsWith(OVERRIDE_PREFIX)) continue
      const desc = k.slice(OVERRIDE_PREFIX.length)
      const v = localStorage.getItem(k)
      if (v) out[desc] = v as SubCategory
    }
  } catch {
    /* ignore */
  }
  return out
}

export function savePrefixOverride(prefix: string, cat: SubCategory): void {
  const all = loadPrefixOverrides()
  all[prefix] = cat
  localStorage.setItem(PREFIX_OVERRIDES_KEY, JSON.stringify(all))
}

export function loadPrefixOverrides(): Record<string, SubCategory> {
  try {
    const raw = localStorage.getItem(PREFIX_OVERRIDES_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, SubCategory>
  } catch {
    return {}
  }
}

// ─── Dismissed alerts ────────────────────────────────────────────────────────

export function loadDismissed(): string[] {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as string[]) : []
  } catch {
    return []
  }
}

export function saveDismissed(keys: string[]): void {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(keys))
}

// ─── Rules ───────────────────────────────────────────────────────────────────

export function saveRules(rules: CategoryRule[]): void {
  localStorage.setItem(RULES_KEY, JSON.stringify(rules))
}

export function loadRules(): CategoryRule[] {
  try {
    const raw = localStorage.getItem(RULES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as CategoryRule[]) : []
  } catch {
    return []
  }
}

// ─── Category tree ───────────────────────────────────────────────────────────

function makeDefaultCategoryTree(): CategoryTree {
  return [
    {
      id: crypto.randomUUID(),
      name: 'Alimentación',
      color: '#f97316',
      subcategories: [
        { id: crypto.randomUUID(), name: 'Supermercado' },
        { id: crypto.randomUUID(), name: 'Restaurante' },
        { id: crypto.randomUUID(), name: 'Delivery' },
        { id: crypto.randomUUID(), name: 'Cafetería' },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: 'Transporte',
      color: '#10b981',
      subcategories: [
        { id: crypto.randomUUID(), name: 'Bencina' },
        { id: crypto.randomUUID(), name: 'Estacionamiento' },
        { id: crypto.randomUUID(), name: 'Taxi / Uber' },
        { id: crypto.randomUUID(), name: 'Locomoción' },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: 'Hogar',
      color: '#84cc16',
      subcategories: [
        { id: crypto.randomUUID(), name: 'Arriendo' },
        { id: crypto.randomUUID(), name: 'Servicios básicos' },
        { id: crypto.randomUUID(), name: 'Ferretería' },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: 'Salud',
      color: '#3b82f6',
      subcategories: [
        { id: crypto.randomUUID(), name: 'Farmacia' },
        { id: crypto.randomUUID(), name: 'Médico' },
        { id: crypto.randomUUID(), name: 'Óptica' },
        { id: crypto.randomUUID(), name: 'Gimnasio' },
        { id: crypto.randomUUID(), name: 'Dentista' },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: 'Vestuario',
      color: '#ec4899',
      subcategories: [
        { id: crypto.randomUUID(), name: 'Ropa' },
        { id: crypto.randomUUID(), name: 'Calzado' },
        { id: crypto.randomUUID(), name: 'Accesorios' },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: 'Ocio',
      color: '#8b5cf6',
      subcategories: [
        { id: crypto.randomUUID(), name: 'Streaming' },
        { id: crypto.randomUUID(), name: 'Videojuegos' },
        { id: crypto.randomUUID(), name: 'Salidas' },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: 'Tecnología',
      color: '#a855f7',
      subcategories: [
        { id: crypto.randomUUID(), name: 'Software / Suscripción' },
        { id: crypto.randomUUID(), name: 'Hardware' },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: 'Educación',
      color: '#06b6d4',
      subcategories: [
        { id: crypto.randomUUID(), name: 'Colegio / Universidad' },
        { id: crypto.randomUUID(), name: 'Cursos' },
        { id: crypto.randomUUID(), name: 'Libros' },
        { id: crypto.randomUUID(), name: 'Útiles' },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: 'Deudas',
      color: '#ef4444',
      subcategories: [
        { id: crypto.randomUUID(), name: 'Tarjeta CMR' },
        { id: crypto.randomUUID(), name: 'Crédito' },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: 'Transferencias',
      color: '#64748b',
      subcategories: [
        { id: crypto.randomUUID(), name: 'Transferencia enviada' },
        { id: crypto.randomUUID(), name: 'Transferencia recibida' },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: 'Sin categorizar',
      color: '#94a3b8',
      subcategories: [{ id: crypto.randomUUID(), name: 'Sin categorizar' }],
    },
  ]
}

export function loadCategoryTree(): CategoryTree {
  try {
    const raw = localStorage.getItem(CATEGORY_TREE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as CategoryTree
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    /* ignore */
  }
  const tree = makeDefaultCategoryTree()
  localStorage.setItem(CATEGORY_TREE_KEY, JSON.stringify(tree))
  return tree
}

export function saveCategoryTree(tree: CategoryTree): void {
  localStorage.setItem(CATEGORY_TREE_KEY, JSON.stringify(tree))
}

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

// ─── Budgets ─────────────────────────────────────────────────────────────────

export type BudgetMap = Record<string, number>

export function saveBudgets(b: BudgetMap): void {
  localStorage.setItem(BUDGETS_KEY, JSON.stringify(b))
}

export function loadBudgets(): BudgetMap {
  try {
    const raw = localStorage.getItem(BUDGETS_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as BudgetMap
  } catch {
    return {}
  }
}

// ─── Clear all ───────────────────────────────────────────────────────────────

export function clearAll(): void {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k) continue
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
      keys.push(k)
    }
  }
  keys.forEach((k) => localStorage.removeItem(k))
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function monthKeyFromData(m: MonthData): string {
  const t0 = m.transactions[0]
  return t0?.month ?? m.label
}
