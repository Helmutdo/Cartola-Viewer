import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertsPanel } from './components/AlertsPanel'
import { BudgetPlanner } from './components/BudgetPlanner'
import { CategoryEditorModal } from './components/CategoryEditorModal'
import { CategoryManager } from './components/CategoryManager'
import { CategoryPieChart } from './components/CategoryPieChart'
import { MerchantManager } from './components/MerchantManager'
import { MetricCards } from './components/MetricCards'
import { MonthBarChart } from './components/MonthBarChart'
import { MonthTabs } from './components/MonthTabs'
import { RulesPanel } from './components/RulesPanel'
import { TransactionTable } from './components/TransactionTable'
import { UploadZone } from './components/UploadZone'
import { useCartola } from './store/useCartola'
import type { Transaction } from './types'

function monthKeyOf(m: { label: string; transactions: { month: string }[] }): string {
  return m.transactions[0]?.month ?? m.label
}

function ArrowUpTray() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-12 w-12 text-amber-500">
      <path d="M11.47 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06l-3.22-3.22V16.5a.75.75 0 0 1-1.5 0V4.81L8.03 8.03a.75.75 0 0 1-1.06-1.06l4.5-4.5Z" />
      <path d="M4.5 15.75a.75.75 0 0 1 .75.75v2.25c0 .414.336.75.75.75h12a.75.75 0 0 0 .75-.75V16.5a.75.75 0 0 1 1.5 0v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V16.5a.75.75 0 0 1 .75-.75Z" />
    </svg>
  )
}

function SparklesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  )
}

function ProcessingOverlay({ isParsing, aiStatus }: { isParsing: boolean; aiStatus: string }) {
  const steps = [
    { label: 'Leyendo PDF…', active: isParsing, done: !isParsing },
    {
      label: 'Categorizando con IA…',
      active: aiStatus === 'running',
      done: aiStatus === 'done',
    },
    { label: 'Listo', active: false, done: aiStatus === 'done' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="w-80 rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="space-y-5">
          {steps.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                s.done ? 'bg-teal-600 text-white' :
                s.active ? 'border-2 border-amber-500 bg-amber-500/20 text-amber-400' :
                'border border-slate-700 text-slate-600'
              }`}>
                {s.done ? '✓' : steps.indexOf(s) + 1}
              </div>
              <span className={`text-sm ${s.done ? 'text-slate-300' : s.active ? 'text-amber-200' : 'text-slate-600'}`}>
                {s.label}
                {s.active && s.label.includes('IA') ? (
                  <>
                    <span className="ml-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-amber-400 border-t-transparent align-middle" />
                    <span className="ml-1 text-xs text-slate-500">(1ra vez ~1 min)</span>
                  </>
                ) : null}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const hydrate = useCartola((s) => s.hydrate)
  const months = useCartola((s) => s.months)
  const selectedKey = useCartola((s) => s.selectedMonthKey)
  const parseError = useCartola((s) => s.parseError)
  const isParsing = useCartola((s) => s.isParsing)
  const aiStatus = useCartola((s) => s.aiStatus)
  const autoCategorizeAll = useCartola((s) => s.autoCategorizeAll)

  const [modalTx, setModalTx] = useState<Transaction | null>(null)
  const autoTriggered = useRef(false)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const hasData = months.length > 0

  // Auto-trigger AI when parsing completes
  useEffect(() => {
    if (!isParsing && hasData && !autoTriggered.current) {
      autoTriggered.current = true
      autoCategorizeAll()
    }
  }, [isParsing, hasData, autoCategorizeAll])

  // Reset trigger when going back to idle
  useEffect(() => {
    if (aiStatus === 'idle' && !isParsing) autoTriggered.current = false
  }, [aiStatus, isParsing])

  const processing = isParsing || aiStatus === 'running'

  const selectedMonth = useMemo(() => {
    if (!selectedKey) return null
    return months.find((m) => monthKeyOf(m) === selectedKey) ?? null
  }, [months, selectedKey])

  const txs = selectedMonth?.transactions ?? []

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 font-bold text-slate-950">
              C
            </span>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-100">Cartola Viewer</h1>
              <p className="text-xs text-slate-500">Inteligente · local · sin backend</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UploadZone compact />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {parseError ? (
          <div className="mb-6 rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {parseError}
          </div>
        ) : null}

        {!hasData && !processing ? (
          /* ── Welcome ── */
          <section className="flex flex-col items-center justify-center py-24">
            <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-500/10">
              <ArrowUpTray />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-100">
              Tus finanzas en un vistazo
            </h2>
            <p className="mt-3 max-w-md text-center text-slate-400">
              Sube tu cartola PDF y deja que la IA categorice tus gastos automáticamente.
              Todo queda en tu navegador — tus datos no salen de tu PC.
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs text-slate-500">
              <SparklesIcon />
              <span>Impulsado por IA local (Llama 3.2 + Ollama)</span>
            </div>
            <div className="mt-10 w-full max-w-md">
              <UploadZone />
            </div>
            <p className="mt-6 text-xs text-slate-600">
              Compatible con Banco Falabella Chile · PDFs de cartolas mensuales
            </p>
          </section>
        ) : null}

        {/* Processing overlay */}
        {processing ? <ProcessingOverlay isParsing={isParsing} aiStatus={aiStatus} /> : null}

        {/* Dashboard */}
        {hasData && !processing ? (
          <div className="space-y-6">
            <MonthTabs />
            <MetricCards transactions={txs} />
            <div className="grid gap-6 lg:grid-cols-2">
              <CategoryPieChart transactions={txs} />
              <AlertsPanel transactions={txs} allMonths={months} currentMonthKey={selectedKey ?? ''} />
            </div>
            <MonthBarChart months={months} />
            <BudgetPlanner transactions={txs} />
            <RulesPanel />
            <MerchantManager />
            <CategoryManager />
            <TransactionTable transactions={txs} monthKey={selectedKey ?? ''} onCategoryClick={setModalTx} />
          </div>
        ) : null}
      </main>

      {modalTx ? (
        <CategoryEditorModal key={modalTx.id} tx={modalTx} onClose={() => setModalTx(null)} />
      ) : null}
    </div>
  )
}
