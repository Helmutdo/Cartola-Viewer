import type { Category } from '../types'
import type { MonthData } from '../types'

const MONTHS_KEY = 'cartola:months'
const BUDGETS_KEY = 'cartola:budgets'
const OVERRIDE_PREFIX = 'override:'
const PREFIX_OVERRIDES_KEY = 'cartola:prefixOverrides'
const DISMISSED_KEY = 'cartola:dismissed'

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

export function saveOverride(desc: string, cat: Category): void {
  localStorage.setItem(`${OVERRIDE_PREFIX}${desc}`, cat)
}

export function loadOverrides(): Record<string, Category> {
  const out: Record<string, Category> = {}
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k || !k.startsWith(OVERRIDE_PREFIX)) continue
      const desc = k.slice(OVERRIDE_PREFIX.length)
      const v = localStorage.getItem(k)
      if (v) out[desc] = v as Category
    }
  } catch {
    /* ignore */
  }
  return out
}

/** Override por prefijo (primeros 20 chars): persiste "Aplicar a todos" con fuzzy match */
export function savePrefixOverride(prefix: string, cat: Category): void {
  const all = loadPrefixOverrides()
  all[prefix] = cat
  localStorage.setItem(PREFIX_OVERRIDES_KEY, JSON.stringify(all))
}

export function loadPrefixOverrides(): Record<string, Category> {
  try {
    const raw = localStorage.getItem(PREFIX_OVERRIDES_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, Category>
  } catch {
    return {}
  }
}

/** Alertas descartadas: array de claves `${monthKey}:tipo[:id]` */
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
      k.startsWith(OVERRIDE_PREFIX)
    ) {
      keys.push(k)
    }
  }
  keys.forEach((k) => localStorage.removeItem(k))
}

export type BudgetMap = Partial<Record<Category, number>>

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

function monthKeyFromData(m: MonthData): string {
  const t0 = m.transactions[0]
  return t0?.month ?? m.label
}
