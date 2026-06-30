import { useCallback, useMemo, useState } from 'react'
import { useCartola } from '../store/useCartola'
import { aiCategorize } from '../lib/aiCategorize'
import { resolveMerchant } from '../lib/merchants'
import type { CategoryRule } from '../lib/rules'
import type { CategoryDefinition, Transaction } from '../types'
import { effectiveCategory } from '../types'

function fmt(n: number) {
  if (n <= 0) return '—'
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
}

function tokens(s: string): string[] {
  return s.split(/\s+/).filter((w) => w.length >= 4).map((w) => w.toUpperCase())
}

function groupSimilar(txs: Transaction[]): Transaction[][] {
  const groups: Transaction[][] = []
  const assigned = new Set<string>()

  for (let i = 0; i < txs.length; i++) {
    if (assigned.has(txs[i].id)) continue
    const group = [txs[i]]
    assigned.add(txs[i].id)
    const ti = tokens(txs[i].desc)

    for (let j = i + 1; j < txs.length; j++) {
      if (assigned.has(txs[j].id)) continue
      const tj = tokens(txs[j].desc)
      const overlap = ti.filter((t) => tj.includes(t)).length
      if (overlap >= 2) {
        group.push(txs[j])
        assigned.add(txs[j].id)
      }
    }
    groups.push(group)
  }

  return groups
}

function GroupCategoryPicker({
  group,
  merchants,
  onSelect,
  onSkip,
}: {
  group: Transaction[]
  merchants: any[]
  onSelect: (sub: string) => void
  onSkip: () => void
}) {
  const categoryTree = useCartola((s) => s.categoryTree)
  const [expandedCat, setExpandedCat] = useState<CategoryDefinition | null>(null)

  const total = group.reduce((s, t) => s + t.cargo + t.abono, 0)
  const mainCats = categoryTree.filter((c) => c.name !== 'Sin categorizar')
  const rep = group[0]!
  const repMerchant = resolveMerchant(rep.desc, merchants)

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
      <div className="mb-3">
        {repMerchant ? (
          <>
            <p className="text-sm font-semibold text-slate-100">{repMerchant.displayName}</p>
            <p className="text-xs text-slate-500">{rep.desc}</p>
          </>
        ) : (
          <p className="text-sm font-semibold text-slate-100">{rep.desc}</p>
        )}
        <p className="mt-1 text-xs text-slate-500">
          {group.length} {group.length === 1 ? 'movimiento' : 'movimientos similares'}
          {total > 0 ? <> · total {fmt(total)}</> : null}
        </p>
        {group.length > 1 && (
          <div className="mt-1 max-h-20 overflow-y-auto text-xs text-slate-500">
            {group.slice(1, 6).map((t) => (
              <p key={t.id} className="truncate">{t.desc}</p>
            ))}
            {group.length > 6 && <p className="text-slate-600">… y {group.length - 6} más</p>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
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
              style={isExpanded ? { background: cat.color, borderColor: cat.color } : undefined}
            >
              {cat.name}
            </button>
          )
        })}
      </div>

      {expandedCat ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {expandedCat.subcategories.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => onSelect(sub.name)}
              className="rounded-full px-3 py-1 text-xs font-medium text-white transition-opacity hover:opacity-80"
              style={{ background: expandedCat.color }}
            >
              {sub.name}
            </button>
          ))}
        </div>
      ) : null}

      {!expandedCat ? (
        <button
          type="button"
          onClick={onSkip}
          className="mt-3 rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-400 hover:bg-slate-700 hover:text-slate-200"
        >
          Dejar sin categorizar
        </button>
      ) : null}
    </div>
  )
}

function ReviewModal({
  uncategorized,
  merchants,
  onClose,
}: {
  uncategorized: Transaction[]
  merchants: any[]
  onClose: () => void
}) {
  const applyDesc = useCartola((s) => s.applyCategoryToDesc)
  const addRule = useCartola((s) => s.addRule)
  const [done, setDone] = useState(false)

  const groups = useMemo(() => groupSimilar(uncategorized).sort((a, b) => b.length - a.length), [uncategorized])

  const [remaining, setRemaining] = useState<Set<string>>(
    () => new Set(uncategorized.map((t) => t.id)),
  )

  function handleSelect(group: Transaction[], sub: string) {
    for (const tx of group) {
      applyDesc(tx.desc, sub)
    }
    const prefix = group[0]!.desc.slice(0, 30)
    if (sub !== 'Sin categorizar') {
      const rule: CategoryRule = {
        id: crypto.randomUUID(),
        pattern: prefix,
        matchType: 'contains',
        category: sub,
        createdAt: new Date().toISOString(),
      }
      addRule(rule)
    }
    const next = new Set(remaining)
    for (const tx of group) next.delete(tx.id)
    setRemaining(next)

    if (next.size === 0) {
      setDone(true)
      setTimeout(onClose, 1200)
    }
  }

  function handleSkip(group: Transaction[]) {
    const next = new Set(remaining)
    for (const tx of group) next.delete(tx.id)
    setRemaining(next)
    if (next.size === 0) {
      setDone(true)
      setTimeout(onClose, 1200)
    }
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

  const active = groups.filter((g) => g.some((t) => remaining.has(t.id)))

  if (active.length === 0) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-8"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {remaining.size} {remaining.size === 1 ? 'movimiento sin categorizar' : 'movimientos sin categorizar'} · {active.length} {active.length === 1 ? 'grupo' : 'grupos'}
          </span>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-200" aria-label="Cerrar">
            ✕
          </button>
        </div>

        {active.map((group) => (
          <GroupCategoryPicker
            key={group[0]!.id}
            group={group}
            merchants={merchants}
            onSelect={(sub) => handleSelect(group, sub)}
            onSkip={() => handleSkip(group)}
          />
        ))}
      </div>
    </div>
  )
}

function AiResultModal({
  total,
  categorized,
  errors,
  onClose,
}: {
  total: number
  categorized: { cat: string; count: number }[]
  errors: number
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-teal-300">IA completada</h2>
        <p className="mt-2 text-sm text-slate-400">
          {total} {total === 1 ? 'movimiento procesado' : 'movimientos procesados'}
        </p>

        {categorized.length > 0 ? (
          <div className="mt-4 space-y-1">
            <p className="text-xs font-medium text-slate-500">Categorías asignadas:</p>
            {categorized.map((c) => (
              <div key={c.cat} className="flex justify-between text-sm">
                <span className="text-slate-200">{c.cat}</span>
                <span className="text-slate-500">{c.count} {c.count === 1 ? 'mov.' : 'movs.'}</span>
              </div>
            ))}
          </div>
        ) : null}

        {errors > 0 ? (
          <p className="mt-3 text-xs text-amber-400">
            {errors} {errors === 1 ? 'movimiento no se pudo categorizar' : 'movimientos no se pudieron categorizar'}
            (quedaron como "Sin categorizar")
          </p>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
        >
          Ver resultados
        </button>
      </div>
    </div>
  )
}

export function QuickReview({ transactions }: { transactions: Transaction[] }) {
  const [open, setOpen] = useState(false)
  const [aiMode, setAiMode] = useState<'idle' | 'loading' | 'running' | 'done'>('idle')
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiResult, setAiResult] = useState<{ categorized: { cat: string; count: number }[]; errors: number; total: number } | null>(null)
  const addRule = useCartola((s) => s.addRule)
  const applyDesc = useCartola((s) => s.applyCategoryToDesc)
  const merchants = useCartola((s) => s.merchants)

  const uncategorized = transactions.filter((t) => effectiveCategory(t) === 'Sin categorizar')

  const handleAiCategorize = useCallback(async () => {
    setAiMode('loading')
    setAiError(null)
    const descs = [...new Set(uncategorized.map((t) => t.desc))]
    try {
      setAiMode('running')
      const results = await aiCategorize(descs)
      const categorized = results.filter((r) => r.category !== 'Sin categorizar')

      const seen = new Set<string>()
      for (const r of categorized) {
        applyDesc(r.desc, r.category)
        const key = `${r.desc.slice(0, 30)}::${r.category}`
        if (!seen.has(key)) {
          seen.add(key)
          addRule({
            id: crypto.randomUUID(),
            pattern: r.desc.slice(0, 30),
            matchType: 'contains',
            category: r.category,
            createdAt: new Date().toISOString(),
          })
        }
      }

      const byCat = new Map<string, number>()
      for (const r of categorized) {
        byCat.set(r.category, (byCat.get(r.category) ?? 0) + 1)
      }
      const agg = [...byCat.entries()]
        .map(([cat, count]) => ({ cat, count }))
        .sort((a, b) => b.count - a.count)

      setAiResult({ categorized: agg, errors: results.length - categorized.length, total: results.length })
      setAiMode('done')
    } catch (e) {
      setAiMode('idle')
      setAiError(e instanceof Error ? e.message : 'Error al conectar con IA')
    }
  }, [uncategorized, applyDesc, addRule])

  if (uncategorized.length === 0 && aiMode !== 'done') return null

  return (
    <>
      {uncategorized.length > 0 ? (
        <div className="flex items-center justify-between rounded-xl border border-amber-900/50 bg-amber-950/30 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-amber-200">
              <strong>{uncategorized.length}</strong>{' '}
              {uncategorized.length === 1 ? 'movimiento sin categorizar' : 'movimientos sin categorizar'}
            </span>
            {aiError ? (
              <span className="rounded bg-red-900/60 px-2 py-0.5 text-xs text-red-300">{aiError}</span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {aiMode === 'loading' || aiMode === 'running' ? (
              <span className="flex items-center gap-2 text-xs text-slate-400">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-fuchsia-400 border-t-transparent" />
                {aiMode === 'loading' ? 'Conectando con IA…' : 'Categorizando…'}
              </span>
            ) : (
              <button
                type="button"
                onClick={handleAiCategorize}
                className="rounded-lg border border-fuchsia-700 bg-fuchsia-950/60 px-3 py-1.5 text-xs font-medium text-fuchsia-200 hover:bg-fuchsia-900/60"
              >
                Categorizar con IA
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500"
            >
              Revisar ahora →
            </button>
          </div>
        </div>
      ) : null}

      {aiMode === 'done' && aiResult ? (
        <AiResultModal
          total={aiResult.total}
          categorized={aiResult.categorized}
          errors={aiResult.errors}
          onClose={() => setAiMode('idle')}
        />
      ) : null}

      {open ? <ReviewModal uncategorized={uncategorized} merchants={merchants} onClose={() => setOpen(false)} /> : null}
    </>
  )
}
