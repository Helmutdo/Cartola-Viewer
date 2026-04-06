import { useCartola } from '../store/useCartola'

function monthKeyOf(m: { label: string; transactions: { month: string }[] }): string {
  return m.transactions[0]?.month ?? m.label
}

export function MonthTabs() {
  const months = useCartola((s) => s.months)
  const selected = useCartola((s) => s.selectedMonthKey)
  const setSel = useCartola((s) => s.setSelectedMonthKey)

  if (months.length === 0) return null

  return (
    <div className="flex gap-1 overflow-x-auto border-b border-slate-800 pb-2">
      {months.map((m) => {
        const key = monthKeyOf(m)
        const active = key === selected
        return (
          <button
            key={key}
            type="button"
            onClick={() => setSel(key)}
            className={
              active
                ? 'shrink-0 rounded-t-lg bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-300 ring-1 ring-amber-500/40'
                : 'shrink-0 rounded-t-lg px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }
          >
            {m.label}
          </button>
        )
      })}
    </div>
  )
}
