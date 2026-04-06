import { useMemo } from 'react'
import { useCartola } from '../store/useCartola'
import type { Transaction } from '../types'
import { effectiveCategory, getMainCategory } from '../types'

function fmt(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
}

export function BudgetPlanner({ transactions }: { transactions: Transaction[] }) {
  const budgets = useCartola((s) => s.budgets)
  const setBudget = useCartola((s) => s.setBudget)
  const categoryTree = useCartola((s) => s.categoryTree)

  const spentByMain = useMemo(() => {
    const m = new Map<string, number>()
    for (const cat of categoryTree) m.set(cat.name, 0)
    for (const t of transactions) {
      const main = getMainCategory(effectiveCategory(t), categoryTree)
      m.set(main, (m.get(main) ?? 0) + t.cargo)
    }
    return m
  }, [transactions, categoryTree])

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-300">Presupuesto por categoría (cargos)</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="pb-2 pr-2">Categoría</th>
              <th className="pb-2 pr-2">Límite mensual</th>
              <th className="pb-2 pr-2">Gastado</th>
              <th className="pb-2 pr-2">Diferencia</th>
              <th className="pb-2">Barra</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {categoryTree.map((cat) => {
              const spent = spentByMain.get(cat.name) ?? 0
              const limit = budgets[cat.name]
              const diff = limit !== undefined ? limit - spent : undefined
              const over = diff !== undefined && diff < 0
              const pct = limit && limit > 0 ? Math.min((spent / limit) * 100, 100) : 0
              return (
                <tr key={cat.id}>
                  <td className="py-2 pr-2">
                    <span className="flex items-center gap-1.5 text-slate-200">
                      <span className="h-2 w-2 rounded-full" style={{ background: cat.color }} />
                      {cat.name}
                    </span>
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      placeholder="—"
                      value={limit ?? ''}
                      onChange={(e) => {
                        const v = e.target.value
                        if (v === '') setBudget(cat.name, undefined)
                        else setBudget(cat.name, parseFloat(v))
                      }}
                      className="w-32 rounded border border-slate-600 bg-slate-800 px-2 py-1 tabular-nums text-slate-100"
                    />
                  </td>
                  <td className="py-2 pr-2 tabular-nums text-slate-400">{fmt(spent)}</td>
                  <td className={`py-2 pr-2 tabular-nums ${over ? 'text-red-400' : 'text-slate-400'}`}>
                    {diff !== undefined ? fmt(Math.abs(diff)) + (over ? ' sobre' : ' libre') : '—'}
                  </td>
                  <td className="py-2">
                    {limit !== undefined && limit > 0 ? (
                      <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-700">
                        <div
                          className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
