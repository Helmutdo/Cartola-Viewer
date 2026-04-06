import { useState } from 'react'
import { useCartola } from '../store/useCartola'
import {
  CATEGORY_TREE,
  effectiveCategory,
  getMainCategory,
  MAIN_CATEGORY_COLORS,
  type SubCategory,
  type Transaction,
} from '../types'

export function CategoryEditorModal({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const applyDesc = useCartola((s) => s.applyCategoryToDesc)
  const applyOne = useCartola((s) => s.applyCategoryToTransaction)
  const [sel, setSel] = useState<SubCategory>(() => effectiveCategory(tx))

  const current = effectiveCategory(tx)
  const auto = tx.cat

  const mainColor = MAIN_CATEGORY_COLORS[getMainCategory(sel)] ?? 'bg-slate-400'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cat-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h2 id="cat-modal-title" className="text-lg font-semibold text-slate-100">
          Categoría del movimiento
        </h2>
        <p className="mt-2 break-words text-sm text-slate-400" title={tx.desc}>
          {tx.desc}
        </p>
        <p className="mt-3 text-xs text-slate-500">
          Automática: <span className="text-slate-300">{auto}</span>
          {tx.catOverride ? (
            <>
              {' '}
              · Manual: <span className="text-amber-300">{tx.catOverride}</span>
            </>
          ) : null}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Vista actual: <span className="font-medium text-slate-200">{current}</span>
        </p>

        <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-slate-500">
          Categoría
        </label>
        <select
          value={sel}
          onChange={(e) => setSel(e.target.value as SubCategory)}
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-amber-500/50"
        >
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

        <div className="mt-2 flex items-center gap-2">
          <span className={`inline-block h-3 w-3 rounded-full ${mainColor}`} />
          <span className="text-xs text-slate-500">
            {getMainCategory(sel)} › {sel}
          </span>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => {
              applyDesc(tx.desc, sel)
              onClose()
            }}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
          >
            Aplicar a todos los movimientos de este comercio
          </button>
          <button
            type="button"
            onClick={() => {
              applyOne(tx.id, sel)
              onClose()
            }}
            className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
          >
            Solo este movimiento
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
