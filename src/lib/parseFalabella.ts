import type { SubCategory } from '../types'
import { autoCategorize } from './categorizer'

export interface ParsedRow {
  fecha: string
  desc: string
  cargo: number
  abono: number
  month: string
  cat: SubCategory
}

/** Ruido en la descripción que Falabella incluye pero no aporta info */
const NOISE_RE = /\b(?:Sucursal Virtual\s+\d+|CASA MATRIZ)\b\s*/gi

/** Detecta si la descripción corresponde a un abono (transferencia recibida, depósito, etc.) */
function isAbonoByDesc(desc: string): boolean {
  return (
    /\bTRANSF\.?\s+DE\b/i.test(desc) ||
    /\bDEP[ÓO]SITO\b/i.test(desc) ||
    /\b(?:DEP|ABONO)\b/i.test(desc)
  )
}

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const

/** Convierte monto chileno tipo 1.234.567 (puntos miles) a número */
export function parseChileanAmount(raw: string): number {
  const s = raw.replace(/\s/g, '').replace(/\./g, '')
  const n = parseInt(s, 10)
  return Number.isFinite(n) ? n : 0
}

function monthKeyAndLabel(fecha: string): { month: string; label: string } | null {
  const m = fecha.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null
  const [, , mo, y] = m
  const mi = parseInt(mo, 10) - 1
  if (mi < 0 || mi > 11) return null
  const month = `${y}-${mo}`
  const label = `${MESES[mi]} ${y}`
  return { month, label }
}

/**
 * Intenta parsear una línea: DD/MM/YYYY ... desc ... $[cargo|abono] $saldo
 * Falabella emite 2 montos por línea (monto + saldo); cuando hay 3 o más se
 * toman los últimos 3 como [cargo, abono, saldo] (formato alternativo).
 */
export function parseTransactionLine(line: string): Omit<ParsedRow, 'cat' | 'month'> | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  const dm = trimmed.match(/^(\d{2}\/\d{2}\/\d{4})/)
  if (!dm) return null

  const rest = trimmed.slice(dm[0].length).trim()
  const re = /\$\s*([\d.]+)/g
  const hits: { val: number; start: number }[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(rest)) !== null) {
    hits.push({ val: parseChileanAmount(m[1]), start: m.index })
  }
  if (hits.length < 2) return null

  let cargo = 0
  let abono = 0
  let descRaw: string

  if (hits.length >= 3) {
    // 3+ montos → [cargo, abono, saldo]
    const last3 = hits.slice(-3)
    cargo = last3[0].val
    abono = last3[1].val
    descRaw = rest.slice(0, last3[0].start)
  } else {
    // 2 montos → [amount, saldo]; determinar cargo/abono por descripción
    const last2 = hits.slice(-2)
    const amount = last2[0].val
    descRaw = rest.slice(0, last2[0].start)
    const descCleanForCheck = descRaw.replace(NOISE_RE, '').trim()
    if (isAbonoByDesc(descCleanForCheck)) {
      abono = amount
    } else {
      cargo = amount
    }
  }

  const desc = descRaw.replace(NOISE_RE, '').trim().replace(/\s+/g, ' ')
  if (!desc) return null

  return { fecha: dm[1], desc, cargo, abono }
}

/**
 * Recibe texto plano extraído del PDF (pdfjs) y devuelve filas parseadas.
 * ids y overrides se aplican en la capa superior.
 */
export function parseFalabella(rawText: string): ParsedRow[] {
  const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const chunks = normalized
    .split(/(?=\d{2}\/\d{2}\/\d{4}\b)/)
    .map((c) => c.trim())
    .filter(Boolean)

  const out: ParsedRow[] = []

  for (const chunk of chunks) {
    const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean)
    for (const line of lines) {
      const row = parseTransactionLine(line)
      if (!row) continue
      const ml = monthKeyAndLabel(row.fecha)
      if (!ml) continue
      out.push({
        ...row,
        month: ml.month,
        cat: autoCategorize(row.desc),
      })
    }
  }

  return out
}

export function monthKeyToLabel(monthKey: string): string {
  const [y, mo] = monthKey.split('-')
  if (!y || !mo) return monthKey
  const mi = parseInt(mo, 10) - 1
  if (mi < 0 || mi > 11) return monthKey
  return `${MESES[mi]} ${y}`
}
