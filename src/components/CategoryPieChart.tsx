import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { Transaction } from '../types'
import { effectiveCategory, getMainCategory, MAIN_CATEGORY_HEX, type MainCategory } from '../types'

const EXCLUDE: MainCategory[] = ['Transferencias']

export function CategoryPieChart({ transactions }: { transactions: Transaction[] }) {
  const sums = new Map<MainCategory, number>()
  for (const t of transactions) {
    const main = getMainCategory(effectiveCategory(t))
    if (EXCLUDE.includes(main)) continue
    const v = t.cargo
    if (v <= 0) continue
    sums.set(main, (sums.get(main) ?? 0) + v)
  }
  const data = [...sums.entries()]
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 text-sm text-slate-500">
        Sin gastos por categoría (excl. transferencias)
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
      <h3 className="mb-2 text-sm font-semibold text-slate-300">Gastos por categoría</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={88}
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={MAIN_CATEGORY_HEX[entry.name as MainCategory] ?? '#94a3b8'}
                  stroke="#0f172a"
                  strokeWidth={1}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) =>
                Number(v ?? 0).toLocaleString('es-CL', {
                  style: 'currency',
                  currency: 'CLP',
                  maximumFractionDigits: 0,
                })
              }
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-1">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: MAIN_CATEGORY_HEX[d.name as MainCategory] ?? '#94a3b8' }}
            />
            {d.name}
          </li>
        ))}
      </ul>
    </div>
  )
}
