import { useCallback, useMemo, useState } from 'react'
import { loadDismissed, saveDismissed } from '../lib/storage'
import type { MonthData, Transaction } from '../types'
import { effectiveCategory } from '../types'

function fmt(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
}

/** Extrae la clave YYYY-MM de un MonthData */
function monthKeyOf(m: MonthData): string {
  return m.transactions[0]?.month ?? m.label
}

interface AlertsPanelProps {
  transactions: Transaction[]
  allMonths: MonthData[]
  currentMonthKey: string
}

export function AlertsPanel({ transactions, allMonths, currentMonthKey }: AlertsPanelProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set(loadDismissed()))

  const dismiss = useCallback((key: string) => {
    setDismissed((prev) => {
      const next = new Set(prev)
      next.add(key)
      saveDismissed([...next])
      return next
    })
  }, [])

  const { unusual, balanceNegative, balance, newMerchants } = useMemo(() => {
    // Gastos inusuales: cargo > 3× promedio del mes Y > $20.000
    const cargos = transactions.map((t) => t.cargo).filter((c) => c > 0)
    const mean = cargos.length ? cargos.reduce((a, b) => a + b, 0) / cargos.length : 0
    const threshold = mean * 3
    const unusual: Transaction[] = []
    if (mean > 0) {
      for (const t of transactions) {
        if (t.cargo > threshold && t.cargo > 20_000) unusual.push(t)
      }
    }

    // Balance negativo (abonos − cargos < 0)
    const abonos = transactions.reduce((s, t) => s + t.abono, 0)
    const cargosTot = transactions.reduce((s, t) => s + t.cargo, 0)
    const balance = abonos - cargosTot

    // Comercios nuevos: desc no vista en meses anteriores (solo si hay 2+ meses)
    const previousMonths = allMonths.filter((m) => monthKeyOf(m) !== currentMonthKey)
    const newMerchants: string[] = []
    if (previousMonths.length > 0) {
      const prevPrefixes = new Set<string>()
      for (const m of previousMonths) {
        for (const t of m.transactions) {
          prevPrefixes.add(t.desc.slice(0, 20))
        }
      }
      const seenInCurrent = new Set<string>()
      for (const t of transactions) {
        const prefix = t.desc.slice(0, 20)
        if (!prevPrefixes.has(prefix) && !seenInCurrent.has(prefix)) {
          seenInCurrent.add(prefix)
          newMerchants.push(t.desc)
        }
      }
    }

    return { unusual, balanceNegative: balance < 0, balance, newMerchants }
  }, [transactions, allMonths, currentMonthKey])

  const balanceKey = `${currentMonthKey}:balance`
  const newMerchantsKey = `${currentMonthKey}:newmerchants`
  const unusualKey = (id: string) => `${currentMonthKey}:unusual:${id}`

  const visibleUnusual = unusual.filter((t) => !dismissed.has(unusualKey(t.id)))
  const showBalance = balanceNegative && !dismissed.has(balanceKey)
  const showNewMerchants = newMerchants.length > 0 && !dismissed.has(newMerchantsKey)

  if (!visibleUnusual.length && !showBalance && !showNewMerchants) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-500">
        Sin alertas activas en este mes.
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-xl border border-amber-900/40 bg-amber-950/20 p-4">
      <h3 className="text-sm font-semibold text-amber-200">Alertas</h3>

      {showBalance ? (
        <div className="flex items-start justify-between gap-2 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-200">
          <span>
            Balance negativo del mes: <strong>{fmt(balance)}</strong> (abonos − cargos).
          </span>
          <button
            type="button"
            onClick={() => dismiss(balanceKey)}
            aria-label="Descartar alerta de balance negativo"
            className="shrink-0 text-red-400 hover:text-red-200"
          >
            ✕
          </button>
        </div>
      ) : null}

      {visibleUnusual.length > 0 ? (
        <div>
          <p className="mb-2 text-xs text-amber-200/80">
            Gastos inusuales (&gt; 3× promedio y &gt; {fmt(20_000)})
          </p>
          <ul className="space-y-1 text-sm text-slate-300">
            {visibleUnusual.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-800 bg-slate-900/60 px-2 py-1.5"
              >
                <span className="max-w-[60%] truncate" title={t.desc}>
                  {t.desc}
                </span>
                <span className="shrink-0 tabular-nums text-rose-300">{fmt(t.cargo)}</span>
                <span className="w-full text-xs text-slate-500">{effectiveCategory(t)}</span>
                <button
                  type="button"
                  onClick={() => dismiss(unusualKey(t.id))}
                  aria-label="Descartar alerta"
                  className="ml-auto text-xs text-slate-500 hover:text-slate-300"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {showNewMerchants ? (
        <div className="rounded-lg border border-sky-900/50 bg-sky-950/30 px-3 py-2 text-sm text-sky-200">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium">
              {newMerchants.length === 1 ? 'Comercio nuevo este mes' : `${newMerchants.length} comercios nuevos este mes`}
            </p>
            <button
              type="button"
              onClick={() => dismiss(newMerchantsKey)}
              aria-label="Descartar alerta de comercios nuevos"
              className="shrink-0 text-sky-400 hover:text-sky-200"
            >
              ✕
            </button>
          </div>
          <ul className="mt-1 space-y-0.5 text-xs text-sky-300/80">
            {newMerchants.map((d) => (
              <li key={d} className="truncate" title={d}>
                {d}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
