import { useEffect, useState } from 'react'
import { useCartola } from '../store/useCartola'
import type { CategoryRule } from '../lib/rules'
import type { CategoryDefinition, Transaction } from '../types'
import { effectiveCategory } from '../types'

function fmt(n: number) {
  if (n <= 0) return '—'
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
}

function ReviewModal({
  uncategorized,
  onClose,
}: {
  uncategorized: Transaction[]
  onClose: () => void
}) {
  const applyOne = useCartola((s) => s.applyCategoryToTransaction)
  const addRule = useCartola((s) => s.addRule)
  const categoryTree = useCartola((s) => s.categoryTree)

  const [index, setIndex] = useState(0)
  const [expandedCat, setExpandedCat] = useState<CategoryDefinition | null>(null)
  const [createRule, setCreateRule] = useState(false)
  const [done, setDone] = useState(false)

  const tx = uncategorized[index]

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const delta = e.key === 'ArrowRight' ? 1 : -1
        setIndex((i) => {
          const next = i + delta
          if (next < 0 || next >= uncategorized.length) return i
          setExpandedCat(null)
          return next
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, uncategorized.length])

  function chooseSub(sub: string) {
    if (!tx) return
    applyOne(tx.id, sub)

    if (createRule) {
      const pattern = tx.desc.slice(0, 20).trim()
      const rule: CategoryRule = {
        id: crypto.randomUUID(),
        pattern,
        matchType: 'contains',
        category: sub,
        createdAt: new Date().toISOString(),
      }
      addRule(rule)
    }

    const nextIndex = index + 1
    if (nextIndex >= uncategorized.length) {
      setDone(true)
      setTimeout(onClose, 1200)
    } else {
      setIndex(nextIndex)
      setExpandedCat(null)
      setCreateRule(false)
    }
  }

  function goTo(delta: number) {
    const next = index + delta
    if (next < 0 || next >= uncategorized.length) return
    setIndex(next)
    setExpandedCat(null)
    setCreateRule(false)
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div className="rounded-2xl border border-slate-700 bg-slate-900 px-10 py-8 text-center shadow-2xl">
          <p className="text-2xl font-semibold text-teal-300">Todo categorizado ✓</p>
        </div>
      </div>
    )
  }

  if (!tx) return null

  const mainCats = categoryTree.filter((c) => c.name !== 'Sin categorizar')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Revisando {index + 1} de {uncategorized.length}
          </span>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-200" aria-label="Cerrar">
            ✕
          </button>
        </div>

        {/* Transaction info */}
        <p className="text-base font-semibold text-slate-100">{tx.desc}</p>
        <p className="mt-1 text-sm text-slate-500">
          {tx.fecha}
          {tx.cargo > 0 ? (
            <> — <span className="text-rose-300">{fmt(tx.cargo)}</span></>
          ) : tx.abono > 0 ? (
            <> — <span className="text-teal-300">{fmt(tx.abono)}</span></>
          ) : null}
        </p>

        {/* Main category grid */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {mainCats.map((cat) => {
            const isExpanded = expandedCat?.id === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setExpandedCat(isExpanded ? null : cat)}
                className={
                  isExpanded
                    ? 'rounded-lg border px-3 py-2 text-sm font-medium text-white transition-colors'
                    : 'rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700'
                }
                style={
                  isExpanded ? { background: cat.color, borderColor: cat.color } : undefined
                }
              >
                {cat.name}
              </button>
            )
          })}
        </div>

        {/* SubCategory expansion */}
        {expandedCat ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {expandedCat.subcategories.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => chooseSub(sub.name)}
                className="rounded-full px-3 py-1 text-xs font-medium text-white transition-opacity hover:opacity-80"
                style={{ background: expandedCat.color }}
              >
                {sub.name}
              </button>
            ))}
          </div>
        ) : null}

        {/* Sin categorizar button */}
        <div className="mt-2">
          <button
            type="button"
            onClick={() => chooseSub('Sin categorizar')}
            className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            Dejar sin categorizar
          </button>
        </div>

        {/* Create rule checkbox */}
        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-slate-400">
          <input
            type="checkbox"
            checked={createRule}
            onChange={(e) => setCreateRule(e.target.checked)}
            className="rounded accent-amber-500"
          />
          Crear regla: siempre que diga &ldquo;{tx.desc.slice(0, 20).trim()}&rdquo; → esta categoría
        </label>

        {/* Navigation */}
        <div className="mt-5 flex justify-between">
          <button
            type="button"
            onClick={() => goTo(-1)}
            disabled={index === 0}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 disabled:opacity-30"
          >
            ← Anterior
          </button>
          <button
            type="button"
            onClick={() => goTo(1)}
            disabled={index >= uncategorized.length - 1}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 disabled:opacity-30"
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  )
}

export function QuickReview({ transactions }: { transactions: Transaction[] }) {
  const [open, setOpen] = useState(false)

  const uncategorized = transactions.filter((t) => effectiveCategory(t) === 'Sin categorizar')

  if (uncategorized.length === 0) return null

  return (
    <>
      <div className="flex items-center justify-between rounded-xl border border-amber-900/50 bg-amber-950/30 px-4 py-3">
        <span className="text-sm text-amber-200">
          <strong>{uncategorized.length}</strong>{' '}
          {uncategorized.length === 1 ? 'movimiento sin categorizar' : 'movimientos sin categorizar'}
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500"
        >
          Revisar ahora →
        </button>
      </div>

      {open ? <ReviewModal uncategorized={uncategorized} onClose={() => setOpen(false)} /> : null}
    </>
  )
}
