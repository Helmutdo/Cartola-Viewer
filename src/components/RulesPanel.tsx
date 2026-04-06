import { useState } from 'react'
import type { CategoryRule } from '../lib/rules'
import { useCartola } from '../store/useCartola'
import { getMainCategory } from '../types'

const MATCH_LABELS: Record<CategoryRule['matchType'], string> = {
  contains: 'Contiene',
  startsWith: 'Empieza con',
  exact: 'Exacto',
}

export function RulesPanel() {
  const rules = useCartola((s) => s.rules)
  const addRule = useCartola((s) => s.addRule)
  const removeRule = useCartola((s) => s.removeRule)
  const reapplyRules = useCartola((s) => s.reapplyRules)
  const categoryTree = useCartola((s) => s.categoryTree)

  const [pattern, setPattern] = useState('')
  const [matchType, setMatchType] = useState<CategoryRule['matchType']>('contains')
  const [category, setCategory] = useState<string>(() => {
    return categoryTree[0]?.subcategories[0]?.name ?? 'Sin categorizar'
  })

  function handleAdd() {
    const trimmed = pattern.trim()
    if (!trimmed) return
    addRule({
      id: crypto.randomUUID(),
      pattern: trimmed,
      matchType,
      category,
      createdAt: new Date().toISOString(),
    })
    setPattern('')
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300">Reglas de categorización</h3>
        <button
          type="button"
          onClick={reapplyRules}
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-slate-100"
        >
          Re-aplicar todas las reglas
        </button>
      </div>

      {rules.length > 0 ? (
        <div className="mb-4 overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-slate-800/80 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-2">Patrón</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Categoría</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rules.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/40">
                  <td className="px-3 py-2 font-mono text-slate-200">{r.pattern}</td>
                  <td className="px-3 py-2 text-slate-400">{MATCH_LABELS[r.matchType]}</td>
                  <td className="px-3 py-2 text-slate-300">
                    <span className="text-slate-500">{getMainCategory(r.category, categoryTree)} › </span>
                    {r.category}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeRule(r.id)}
                      className="text-xs text-slate-500 hover:text-red-400"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mb-4 text-sm text-slate-500">No hay reglas activas.</p>
      )}

      {/* Add rule form */}
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Patrón
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="ej. COPEC"
            className="w-40 rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Tipo
          <select
            value={matchType}
            onChange={(e) => setMatchType(e.target.value as CategoryRule['matchType'])}
            className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-100"
          >
            <option value="contains">Contiene</option>
            <option value="startsWith">Empieza con</option>
            <option value="exact">Exacto</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Subcategoría
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-100"
          >
            {categoryTree.map((cat) => (
              <optgroup key={cat.id} label={cat.name}>
                {cat.subcategories.map((sub) => (
                  <option key={sub.id} value={sub.name}>
                    {sub.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!pattern.trim()}
          className="rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-40"
        >
          Agregar
        </button>
      </div>
    </div>
  )
}
