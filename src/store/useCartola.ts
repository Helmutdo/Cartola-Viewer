import { create } from 'zustand'
import { categorize, type CategoryRule } from '../lib/rules'
import { monthKeyToLabel, parseFalabella, type ParsedRow } from '../lib/parseFalabella'
import { extractTextFromPdfFile } from '../lib/pdfText'
import { aiCategorize } from '../lib/aiCategorize'
import {
  clearAll,
  loadAllMonths,
  loadBudgets,
  loadCategoryTree,
  loadMerchants,
  loadOverrides,
  loadPrefixOverrides,
  loadRules,
  saveBudgets,
  saveCategoryTree,
  saveMonthData,
  saveMerchants,
  savePrefixOverride,
  saveRules,
  type BudgetMap,
} from '../lib/storage'
import type { CategoryTree, MerchantAlias, MonthData, SubCategory, Transaction } from '../types'
import { effectiveCategory } from '../types'

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
  categoryTree: CategoryTree
  merchants: MerchantAlias[]
  parseError: string | null
  isParsing: boolean
  aiStatus: 'idle' | 'running' | 'done'
  aiError: string | null
  aiCount: number

  hydrate: () => void
  addPdfFiles: (files: FileList | File[]) => Promise<void>
  autoCategorizeAll: () => Promise<number>
  setSelectedMonthKey: (key: string | null) => void
  applyCategoryToDesc: (desc: string, cat: SubCategory) => void
  applyCategoryToTransaction: (id: string, cat: SubCategory) => void
  setBudget: (cat: string, limit: number | undefined) => void
  addRule: (rule: CategoryRule) => void
  removeRule: (id: string) => void
  updateRule: (id: string, changes: Partial<CategoryRule>) => void
  reapplyRules: () => void

  setCategoryTree: (tree: CategoryTree) => void

  addMerchant: (alias: Omit<MerchantAlias, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateMerchant: (id: string, changes: Partial<Pick<MerchantAlias, 'displayName' | 'patterns' | 'defaultCategory'>>) => void
  removeMerchant: (id: string) => void

  /** Migra la clave de presupuesto al renombrar una categoría principal */
  renameMainCategory: (oldName: string, newName: string) => void
  /** Actualiza cat y catOverride en todas las transacciones al renombrar una subcategoría */
  renameSubcategory: (oldName: string, newName: string) => void
  /** Pone 'Sin categorizar' en las transacciones que usen alguna de esas subcategorías */
  removeSubcategories: (subNames: string[]) => void

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
  categoryTree: [],
  merchants: [],
  parseError: null,
  isParsing: false,
  aiStatus: 'idle' as const,
  aiError: null,
  aiCount: 0,

  hydrate: () => {
    const months = loadAllMonths()
    const budgets = loadBudgets()
    const rules = loadRules()
    const categoryTree = loadCategoryTree()
    const merchants = loadMerchants()
    const keys = months.map(monthKeyOf).filter(Boolean).sort()
    set({
      months,
      budgets,
      rules,
      categoryTree,
      merchants,
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
    set({ isParsing: true, parseError: null, aiStatus: 'idle', aiError: null, aiCount: 0 })
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

  setCategoryTree: (tree) => {
    saveCategoryTree(tree)
    set({ categoryTree: tree })
  },

  addMerchant: (alias) => {
    const now = new Date().toISOString()
    const m: MerchantAlias = { ...alias, id: crypto.randomUUID(), createdAt: now, updatedAt: now }
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

  renameMainCategory: (oldName, newName) => {
    if (oldName === newName) return
    const budgets = { ...get().budgets }
    if (oldName in budgets) {
      budgets[newName] = budgets[oldName]
      delete budgets[oldName]
      saveBudgets(budgets)
      set({ budgets })
    }
  },

  renameSubcategory: (oldName, newName) => {
    if (oldName === newName) return
    const months = get().months.map((m) => ({
      ...m,
      transactions: m.transactions.map((t) => ({
        ...t,
        cat: t.cat === oldName ? newName : t.cat,
        catOverride: t.catOverride === oldName ? newName : t.catOverride,
      })),
    }))
    persistAllMonths(months)
    set({ months })
  },

  removeSubcategories: (subNames) => {
    const removed = new Set(subNames)
    const months = get().months.map((m) => ({
      ...m,
      transactions: m.transactions.map((t) => {
        const eff = effectiveCategory(t)
        if (!removed.has(eff)) return t
        return {
          ...t,
          cat: removed.has(t.cat) ? 'Sin categorizar' : t.cat,
          catOverride: t.catOverride !== undefined && removed.has(t.catOverride) ? undefined : t.catOverride,
        }
      }),
    }))
    persistAllMonths(months)
    set({ months })
  },

  autoCategorizeAll: async () => {
    set({ aiStatus: 'running', aiError: null, aiCount: 0 })
    const { months } = get()
    const allTxs = months.flatMap((m) => m.transactions)
    const uncategorized = allTxs.filter((t) => effectiveCategory(t) === 'Sin categorizar')
    const descs = [...new Set(uncategorized.map((t) => t.desc))]
    if (descs.length === 0) {
      set({ aiStatus: 'done', aiCount: 0 })
      return 0
    }
    try {
      const results = await aiCategorize(descs)
      const categorized = results.filter((r) => r.category !== 'Sin categorizar')
      const seen = new Set<string>()
      for (const r of categorized) {
        get().applyCategoryToDesc(r.desc, r.category)
        const key = `${r.desc.slice(0, 30)}::${r.category}`
        if (!seen.has(key)) {
          seen.add(key)
          get().addRule({
            id: crypto.randomUUID(),
            pattern: r.desc.slice(0, 30),
            matchType: 'contains',
            category: r.category,
            createdAt: new Date().toISOString(),
          })
        }
      }
      set({ aiStatus: 'done', aiCount: categorized.length, aiError: null })
      return categorized.length
    } catch (e) {
      set({ aiStatus: 'idle', aiError: e instanceof Error ? e.message : 'Error al conectar con IA' })
      return 0
    }
  },

  resetAll: () => {
    clearAll()
    const categoryTree = loadCategoryTree()
    set({ months: [], selectedMonthKey: null, budgets: {}, rules: [], categoryTree, parseError: null, aiStatus: 'idle', aiError: null, aiCount: 0 })
  },
}))
