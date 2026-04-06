import type { Transaction } from '../types'

function fmt(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
}

export function MetricCards({ transactions }: { transactions: Transaction[] }) {
  const abonos = transactions.reduce((s, t) => s + t.abono, 0)
  const cargos = transactions.reduce((s, t) => s + t.cargo, 0)
  const balance = abonos - cargos
  let mayor = 0
  let mayorDesc = '—'
  for (const t of transactions) {
    if (t.cargo > mayor) {
      mayor = t.cargo
      mayorDesc = t.desc.slice(0, 40) + (t.desc.length > 40 ? '…' : '')
    }
  }

  const cards = [
    { title: 'Abonos totales', value: fmt(abonos), tone: 'text-teal-300' },
    { title: 'Cargos totales', value: fmt(cargos), tone: 'text-rose-300' },
    { title: 'Balance', value: fmt(balance), tone: balance < 0 ? 'text-red-400' : 'text-slate-100' },
    { title: 'Mayor gasto', value: mayor > 0 ? fmt(mayor) : '—', sub: mayor > 0 ? mayorDesc : undefined, tone: 'text-amber-300' },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.title}
          className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-black/20"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{c.title}</p>
          <p className={`mt-1 text-xl font-semibold tabular-nums ${c.tone}`}>{c.value}</p>
          {c.sub ? <p className="mt-1 truncate text-xs text-slate-500" title={c.sub}>{c.sub}</p> : null}
        </div>
      ))}
    </div>
  )
}
