import { useState } from 'react'
import { useCartola } from '../store/useCartola'
import type { MerchantAlias } from '../types'

function MerchantRow({
  merchant,
  onUpdate,
  onRemove,
}: {
  merchant: MerchantAlias
  onUpdate: (id: string, changes: Partial<Pick<MerchantAlias, 'displayName' | 'patterns' | 'defaultCategory'>>) => void
  onRemove: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(merchant.displayName)
  const [patterns, setPatterns] = useState(merchant.patterns.join(', '))

  function save() {
    const trimmedName = name.trim()
    const trimmedPatterns = patterns.split(',').map((p) => p.trim()).filter(Boolean)
    if (!trimmedName || trimmedPatterns.length === 0) return
    onUpdate(merchant.id, { displayName: trimmedName, patterns: trimmedPatterns })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="rounded-lg border border-amber-700/40 bg-slate-800/60 p-3 text-sm">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-2 w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-1.5 text-slate-100 outline-none focus:ring-2 focus:ring-amber-500/50"
          placeholder="Nombre del comercio"
        />
        <input
          value={patterns}
          onChange={(e) => setPatterns(e.target.value)}
          className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-1.5 text-slate-100 outline-none focus:ring-2 focus:ring-amber-500/50"
          placeholder="Patrones separados por coma"
        />
        <p className="mt-1 text-xs text-slate-500">
          Separar patrones con coma. Se busca como substring (sin distinguir mayúsculas).
        </p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={save}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500"
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-700"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 bg-slate-800/40 px-3 py-2 text-sm">
      <div className="min-w-0">
        <p className="font-medium text-slate-200">{merchant.displayName}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500" title={merchant.patterns.join(' | ')}>
          {merchant.patterns.join(' · ')}
        </p>
        {merchant.defaultCategory && (
          <p className="mt-0.5 text-xs text-amber-400/70">{merchant.defaultCategory}</p>
        )}
      </div>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded px-2 py-1 text-xs text-slate-400 hover:bg-slate-700 hover:text-slate-200"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm(`¿Eliminar alias "${merchant.displayName}"?`)) onRemove(merchant.id)
          }}
          className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-red-900/40 hover:text-red-300"
        >
          Eliminar
        </button>
      </div>
    </div>
  )
}

export function MerchantManager() {
  const merchants = useCartola((s) => s.merchants)
  const updateMerchant = useCartola((s) => s.updateMerchant)
  const removeMerchant = useCartola((s) => s.removeMerchant)

  const userMerchants = merchants.filter((m) => m.source === 'user')

  if (userMerchants.length === 0) return null

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-300">
        Comercios guardados ({userMerchants.length})
      </h3>
      <div className="flex flex-col gap-2">
        {userMerchants.map((m) => (
          <MerchantRow
            key={m.id}
            merchant={m}
            onUpdate={updateMerchant}
            onRemove={removeMerchant}
          />
        ))}
      </div>
    </section>
  )
}
