export interface Transaction {
  id: string
  fecha: string
  desc: string
  cargo: number
  abono: number
  cat: Category
  catOverride?: Category
  month: string
}

export type Category =
  | 'Comida'
  | 'Bencina'
  | 'Compras'
  | 'Tecnología'
  | 'Transporte'
  | 'Alojamiento'
  | 'Servicios'
  | 'Tarjeta CMR'
  | 'Transferencia enviada'
  | 'Transferencia recibida'
  | 'Otros'

export interface MonthData {
  label: string
  transactions: Transaction[]
  uploadedAt: string
}

export const ALL_CATEGORIES: Category[] = [
  'Comida',
  'Bencina',
  'Compras',
  'Tecnología',
  'Transporte',
  'Alojamiento',
  'Servicios',
  'Tarjeta CMR',
  'Transferencia enviada',
  'Transferencia recibida',
  'Otros',
]

/** Colores Tailwind (clase bg-*) por categoría */
export const CATEGORY_COLORS: Record<Category, string> = {
  Comida: 'bg-orange-500',
  Bencina: 'bg-amber-500',
  Compras: 'bg-blue-500',
  Tecnología: 'bg-violet-500',
  Transporte: 'bg-emerald-600',
  Alojamiento: 'bg-pink-500',
  Servicios: 'bg-lime-400',
  'Tarjeta CMR': 'bg-red-500',
  'Transferencia enviada': 'bg-slate-500',
  'Transferencia recibida': 'bg-teal-400',
  Otros: 'bg-slate-400',
}

/** Hex para Recharts */
export const CATEGORY_HEX: Record<Category, string> = {
  Comida: '#f97316',
  Bencina: '#f59e0b',
  Compras: '#3b82f6',
  Tecnología: '#8b5cf6',
  Transporte: '#059669',
  Alojamiento: '#ec4899',
  Servicios: '#a3e635',
  'Tarjeta CMR': '#ef4444',
  'Transferencia enviada': '#64748b',
  'Transferencia recibida': '#2dd4bf',
  Otros: '#94a3b8',
}

export function effectiveCategory(t: Transaction): Category {
  return t.catOverride ?? t.cat
}
