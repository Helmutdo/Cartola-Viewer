import { create } from 'zustand'
import { categorize, type CategoryRule } from '../lib/rules'
import { monthKeyToLabel, parseFalabella, type ParsedRow } from '../lib/parseFalabella'
import { extractTextFromPdfFile } from '../lib/pdfText'
import {
  clearAll,
  loadAllMonths,
  loadBudgets,
  loadOverrides,
  loadPrefixOverrides,
  loadRules,
  saveBudgets,
  saveMonthData,
  savePrefixOverride,
  saveRules,
  type BudgetMap,
} from '../lib/storage'
import type { MainCategory, MonthData, SubCategory, Transaction } from '../types'

function rowsToTransactions(
  rows: ParsedRow[],
  overrides: Record<string, SubCategory>,
  prefixOverrides: Record<string, SubCategory>,
  rules: CategoryRule[],
): Transaction[] {
  return rows.map((r) => {
    const prefix = r.desc.slice(0, 20)
    const o = overrides[r.desc] ?? prefixOverrides[prefix]
    return {
      id: crypto.randomUUID(),
      fecha: r.fecha,
      desc: r.desc,
      cargo: r.cargo,
      abono: r.abono,
      cat: categorize(r.desc, rules),
      catOverride: o,
      month: r.month,
    }
  })
}

function groupRowsToMonths(
  rows: ParsedRow[],
  uploadedAt: string,
  overrides: Record<string, SubCategory>,
  prefixOverrides: Record<string, SubCategory>,
  rules: CategoryRule[],
): MonthData[] {
  const by = new Map<string, ParsedRow[]>()
  for (const r of rows) {
    const list = by.get(r.month) ?? []
    list.push(r)
    by.set(r.month, list)
  }
  const keys = [...by.keys()].sort()
  return keys.map((monthKey) => ({
    label: monthKeyToLabel(monthKey),
    transactions: rowsToTransactions(by.get(monthKey)!, overrides, prefixOverrides, rules),
    uploadedAt,
  }))
}

/** Re-categoriza todas las transacciones en memoria (sin alterar catOverride). */
function recategorizeMonths(months: MonthData[], rules: CategoryRule[]): MonthData[] {
  return months.map((m) => ({
    ...m,
    transactions: m.transactions.map((t) => ({
      ...t,
      cat: categorize(t.desc, rules),
    })),
  }))
}

interface CartolaState {
  months: MonthData[]
  selectedMonthKey: string | null
  budgets: BudgetMap
  rules: CategoryRule[]
  parseError: string | null
  isParsing: boolean
  hydrate: () => void
  addPdfFiles: (files: FileList | File[]) => Promise<void>
  setSelectedMonthKey: (key: string | null) => void
  applyCategoryToDesc: (desc: string, cat: SubCategory) => void
  applyCategoryToTransaction: (id: string, cat: SubCategory) => void
  setBudget: (cat: MainCategory, limit: number | undefined) => void
  addRule: (rule: CategoryRule) => void
  removeRule: (id: string) => void
  updateRule: (id: string, changes: Partial<CategoryRule>) => void
  reapplyRules: () => void
  resetAll: () => void
}

function monthKeyOf(data: MonthData): string {
  return data.transactions[0]?.month ?? data.label
}

function persistAllMonths(months: MonthData[]) {
  for (const m of months) saveMonthData(m)
}

export const useCartola = create<CartolaState>((set, get) => ({
  months: [],
  selectedMonthKey: null,
  budgets: {},
  rules: [],
  parseError: null,
  isParsing: false,

  hydrate: () => {
    const months = loadAllMonths()
    const budgets = loadBudgets()
    const rules = loadRules()
    const keys = months.map(monthKeyOf).filter(Boolean).sort()
    set({
      months,
      budgets,
      rules,
      selectedMonthKey:
        get().selectedMonthKey && keys.includes(get().selectedMonthKey!)
          ? get().selectedMonthKey
          : (keys[keys.length - 1] ?? null),
    })
  },

  addPdfFiles: async (files) => {
    const list = Array.from(files).filter((f) => f.name.toLowerCase().endsWith('.pdf'))
    if (list.length === 0) {
      set({ parseError: 'Selecciona al menos un PDF.' })
      return
    }
    set({ isParsing: true, parseError: null })
    try {
      const overrides = loadOverrides()
      const prefixOverrides = loadPrefixOverrides()
      const rules = get().rules
      const merged = [...get().months]
      const uploadedAt = new Date().toISOString()

      for (const file of list) {
        const text = await extractTextFromPdfFile(file)
        const rows = parseFalabella(text)
        if (rows.length === 0) {
          set({ parseError: `No se detectaron movimientos en "${file.name}".` })
          continue
        }
        const newMonths = groupRowsToMonths(rows, uploadedAt, overrides, prefixOverrides, rules)
        for (const nm of newMonths) {
          const k = monthKeyOf(nm)
          const idx = merged.findIndex((m) => monthKeyOf(m) === k)
          if (idx >= 0) {
            merged[idx] = { ...nm }
          } else {
            merged.push(nm)
          }
        }
      }

      merged.sort((a, b) => monthKeyOf(a).localeCompare(monthKeyOf(b)))
      persistAllMonths(merged)
      const sel = monthKeyOf(merged[merged.length - 1]!)
      set({ months: merged, selectedMonthKey: sel, isParsing: false, parseError: null })
    } catch (e) {
      set({
        isParsing: false,
        parseError: e instanceof Error ? e.message : 'Error al leer el PDF.',
      })
    }
  },

  setSelectedMonthKey: (key) => set({ selectedMonthKey: key }),

  applyCategoryToDesc: (desc, cat) => {
    const prefix = desc.slice(0, 20)
    savePrefixOverride(prefix, cat)
    const months = get().months.map((m) => ({
      ...m,
      transactions: m.transactions.map((t) =>
        t.desc.slice(0, 20) === prefix ? { ...t, catOverride: cat } : t,
      ),
    }))
    set({ months })
    persistAllMonths(months)
  },

  applyCategoryToTransaction: (id, cat) => {
    const months = get().months.map((m) => ({
      ...m,
      transactions: m.transactions.map((t) => (t.id === id ? { ...t, catOverride: cat } : t)),
    }))
    set({ months })
    persistAllMonths(months)
  },

  setBudget: (cat, limit) => {
    const budgets = { ...get().budgets }
    if (limit === undefined || limit <= 0 || Number.isNaN(limit)) delete budgets[cat]
    else budgets[cat] = limit
    saveBudgets(budgets)
    set({ budgets })
  },

  addRule: (rule) => {
    const rules = [...get().rules, rule]
    saveRules(rules)
    const months = recategorizeMonths(get().months, rules)
    persistAllMonths(months)
    set({ rules, months })
  },

  removeRule: (id) => {
    const rules = get().rules.filter((r) => r.id !== id)
    saveRules(rules)
    const months = recategorizeMonths(get().months, rules)
    persistAllMonths(months)
    set({ rules, months })
  },

  updateRule: (id, changes) => {
    const rules = get().rules.map((r) => (r.id === id ? { ...r, ...changes } : r))
    saveRules(rules)
    const months = recategorizeMonths(get().months, rules)
    persistAllMonths(months)
    set({ rules, months })
  },

  reapplyRules: () => {
    const rules = get().rules
    const months = recategorizeMonths(get().months, rules)
    persistAllMonths(months)
    set({ months })
  },

  resetAll: () => {
    clearAll()
    set({ months: [], selectedMonthKey: null, budgets: {}, rules: [], parseError: null })
  },
}))
