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

  // Si ya hay merchant resuelto ir directo al paso 2
  const [step, setStep] = useState<1 | 2>(existingMerchant ? 2 : 1)
  const [merchantName, setMerchantName] = useState(existingMerchant?.displayName ?? '')
  const [sel, setSel] = useState<string>(() => effectiveCategory(tx))

  const current = effectiveCategory(tx)
  const auto = tx.cat
  const mainCat = categoryTree.find((c) => c.subcategories.some((s) => s.name === sel))
  const dotColor = mainCat?.color ?? '#94a3b8'

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
              <button
                type="button"
                onClick={onClose}
                className="ml-auto rounded-lg px-3 py-2 text-sm text-slate-500 hover:text-slate-200"
              >
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
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
              >
                Cancelar
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
