import { useMemo, useState } from 'react'
import type { SubCategory, Transaction } from '../types'
import {
  CATEGORY_TREE,
  effectiveCategory,
  getMainCategory,
  MAIN_CATEGORY_HEX,
} from '../types'

function exportCsv(transactions: Transaction[], monthKey: string) {
  const header = 'fecha,descripcion,categoria_principal,subcategoria,cargo,abono\n'
  const rows = transactions
    .map((t) => {
      const sub = effectiveCategory(t)
      const main = getMainCategory(sub)
      const desc = `"${t.desc.replace(/"/g, '""')}"`
      return [t.fecha, desc, main, sub, t.cargo > 0 ? t.cargo : '', t.abono > 0 ? t.abono : ''].join(',')
    })
    .join('\n')
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cartola-${monthKey}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function fmt(n: number) {
  if (n <= 0) return '—'
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
}

type TypeFilter = 'todos' | 'cargos' | 'abonos'

const PencilIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="currentColor"
    className="h-3 w-3 shrink-0 opacity-70"
    aria-label="categoría editada"
  >
    <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L2.75 10.776a.75.75 0 0 0-.197.37l-.5 2.5a.75.75 0 0 0 .883.882l2.5-.5a.75.75 0 0 0 .37-.196l8.263-8.263a1.75 1.75 0 0 0 0-2.475Z" />
  </svg>
)

export function TransactionTable({
  transactions,
  monthKey,
  onCategoryClick,
}: {
  transactions: Transaction[]
  monthKey: string
  onCategoryClick: (t: Transaction) => void
}) {
  const [catFilter, setCatFilter] = useState<SubCategory | 'todas'>('todas')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('todos')

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (catFilter !== 'todas' && effectiveCategory(t) !== catFilter) return false
      if (typeFilter === 'cargos' && t.cargo <= 0) return false
      if (typeFilter === 'abonos' && t.abono <= 0) return false
      return true
    })
  }, [transactions, catFilter, typeFilter])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const [da, ma, ya] = a.fecha.split('/').map(Number)
      const [db, mb, yb] = b.fecha.split('/').map(Number)
      const ta = new Date(ya, ma - 1, da).getTime()
      const tb = new Date(yb, mb - 1, db).getTime()
      return tb - ta
    })
  }, [filtered])

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <h3 className="mr-auto text-sm font-semibold text-slate-300">Movimientos</h3>
        <button
          type="button"
          onClick={() => exportCsv(sorted, monthKey)}
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-slate-100"
        >
          Exportar CSV
        </button>
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Categoría
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value as SubCategory | 'todas')}
            className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-100"
          >
            <option value="todas">Todas</option>
            {Object.entries(CATEGORY_TREE).map(([main, subs]) => (
              <optgroup key={main} label={main}>
                {subs.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Tipo
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-100"
          >
            <option value="todos">Todos</option>
            <option value="cargos">Solo cargos</option>
            <option value="abonos">Solo abonos</option>
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-800/80 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Descripción</th>
              <th className="px-3 py-2 text-right">Cargo</th>
              <th className="px-3 py-2 text-right">Abono</th>
              <th className="px-3 py-2">Categoría</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {sorted.map((t) => {
              const sub = effectiveCategory(t)
              const main = getMainCategory(sub)
              const dotColor = MAIN_CATEGORY_HEX[main] ?? '#94a3b8'
              return (
                <tr key={t.id} className="hover:bg-slate-800/40">
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-slate-400">{t.fecha}</td>
                  <td className="max-w-[280px] truncate px-3 py-2 text-slate-200" title={t.desc}>
                    {t.desc}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-rose-300">
                    {fmt(t.cargo)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-teal-300">
                    {fmt(t.abono)}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => onCategoryClick(t)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: dotColor }}
                      />
                      {sub}
                      {t.catOverride ? <PencilIcon /> : null}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {sorted.length === 0 ? (
          <p className="p-4 text-center text-sm text-slate-500">No hay movimientos con estos filtros.</p>
        ) : null}
      </div>
    </div>
  )
}
