import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { MonthData } from '../types'

function monthKeyOf(m: MonthData): string {
  return m.transactions[0]?.month ?? m.label
}

export function MonthBarChart({ months }: { months: MonthData[] }) {
  const data = [...months]
    .sort((a, b) => monthKeyOf(a).localeCompare(monthKeyOf(b)))
    .map((m) => {
      const abonos = m.transactions.reduce((s, t) => s + t.abono, 0)
      const cargos = m.transactions.reduce((s, t) => s + t.cargo, 0)
      return { name: m.label, Abonos: abonos, Cargos: cargos }
    })

  if (data.length === 0) return null

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
      <h3 className="mb-2 text-sm font-semibold text-slate-300">Comparativo mensual</h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#475569' }} />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#475569' }}
              tickFormatter={(v: number) => {
                if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
                if (v >= 1000) return `${(v / 1000).toFixed(0)}k`
                return String(v)
              }}
            />
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
            <Bar dataKey="Abonos" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Cargos" fill="#fb7185" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
