import { useEffect, useMemo, useState } from 'react'
import { AlertsPanel } from './components/AlertsPanel'
import { BudgetPlanner } from './components/BudgetPlanner'
import { CategoryEditorModal } from './components/CategoryEditorModal'
import { CategoryManager } from './components/CategoryManager'
import { CategoryPieChart } from './components/CategoryPieChart'
import { MetricCards } from './components/MetricCards'
import { MonthBarChart } from './components/MonthBarChart'
import { MonthTabs } from './components/MonthTabs'
import { QuickReview } from './components/QuickReview'
import { RulesPanel } from './components/RulesPanel'
import { TransactionTable } from './components/TransactionTable'
import { UploadZone } from './components/UploadZone'
import { useCartola } from './store/useCartola'
import type { Transaction } from './types'

function monthKeyOf(m: { label: string; transactions: { month: string }[] }): string {
  return m.transactions[0]?.month ?? m.label
}

export default function App() {
  const hydrate = useCartola((s) => s.hydrate)
  const months = useCartola((s) => s.months)
  const selectedKey = useCartola((s) => s.selectedMonthKey)
  const parseError = useCartola((s) => s.parseError)
  const resetAll = useCartola((s) => s.resetAll)

  const [modalTx, setModalTx] = useState<Transaction | null>(null)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const selectedMonth = useMemo(() => {
    if (!selectedKey) return null
    return months.find((m) => monthKeyOf(m) === selectedKey) ?? null
  }, [months, selectedKey])

  const txs = selectedMonth?.transactions ?? []

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 font-bold text-slate-950">
              C
            </span>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-100">Cartola Viewer</h1>
              <p className="text-xs text-slate-500">Banco Falabella · local · sin backend</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UploadZone compact />
            {months.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('¿Borrar todos los meses, presupuestos y categorías guardadas?')) resetAll()
                }}
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              >
                Limpiar datos
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {parseError ? (
          <div className="rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {parseError}
          </div>
        ) : null}

        {months.length === 0 ? (
          <section className="flex flex-col items-center py-12">
            <p className="mb-6 max-w-md text-center text-slate-400">
              Sube el PDF de tu cartola para extraer movimientos, categorizarlos y ver resúmenes. Todo queda en tu
              navegador (localStorage).
            </p>
            <UploadZone />
          </section>
        ) : (
          <>
            <MonthTabs />
            <QuickReview transactions={txs} />
            <MetricCards transactions={txs} />
            <div className="grid gap-6 lg:grid-cols-2">
              <CategoryPieChart transactions={txs} />
              <AlertsPanel transactions={txs} allMonths={months} currentMonthKey={selectedKey ?? ''} />
            </div>
            <MonthBarChart months={months} />
            <BudgetPlanner transactions={txs} />
            <RulesPanel />
            <CategoryManager />
            <TransactionTable transactions={txs} monthKey={selectedKey ?? ''} onCategoryClick={setModalTx} />
          </>
        )}
      </main>

      {modalTx ? (
        <CategoryEditorModal key={modalTx.id} tx={modalTx} onClose={() => setModalTx(null)} />
      ) : null}
    </div>
  )
}
