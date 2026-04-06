export type SubCategory =
  // Alimentación
  | 'Supermercado'
  | 'Restaurante'
  | 'Delivery'
  | 'Cafetería'
  // Transporte
  | 'Bencina'
  | 'Estacionamiento'
  | 'Taxi / Uber'
  | 'Locomoción'
  // Hogar
  | 'Arriendo'
  | 'Servicios básicos'
  | 'Ferretería'
  // Salud
  | 'Farmacia'
  | 'Médico'
  | 'Óptica'
  // Vestuario
  | 'Ropa'
  | 'Calzado'
  | 'Accesorios'
  // Ocio
  | 'Streaming'
  | 'Videojuegos'
  | 'Salidas'
  // Tecnología
  | 'Software / Suscripción'
  | 'Hardware'
  // Deudas
  | 'Tarjeta CMR'
  | 'Crédito'
  // Transferencias
  | 'Transferencia enviada'
  | 'Transferencia recibida'
  // Sin categorizar
  | 'Sin categorizar'

export type MainCategory =
  | 'Alimentación'
  | 'Transporte'
  | 'Hogar'
  | 'Salud'
  | 'Vestuario'
  | 'Ocio'
  | 'Tecnología'
  | 'Deudas'
  | 'Transferencias'
  | 'Sin categorizar'

export const CATEGORY_TREE: Record<MainCategory, SubCategory[]> = {
  Alimentación: ['Supermercado', 'Restaurante', 'Delivery', 'Cafetería'],
  Transporte: ['Bencina', 'Estacionamiento', 'Taxi / Uber', 'Locomoción'],
  Hogar: ['Arriendo', 'Servicios básicos', 'Ferretería'],
  Salud: ['Farmacia', 'Médico', 'Óptica'],
  Vestuario: ['Ropa', 'Calzado', 'Accesorios'],
  Ocio: ['Streaming', 'Videojuegos', 'Salidas'],
  Tecnología: ['Software / Suscripción', 'Hardware'],
  Deudas: ['Tarjeta CMR', 'Crédito'],
  Transferencias: ['Transferencia enviada', 'Transferencia recibida'],
  'Sin categorizar': ['Sin categorizar'],
}

export const ALL_MAIN_CATEGORIES = Object.keys(CATEGORY_TREE) as MainCategory[]

export function getMainCategory(sub: SubCategory): MainCategory {
  for (const [main, subs] of Object.entries(CATEGORY_TREE) as [MainCategory, SubCategory[]][]) {
    if ((subs as string[]).includes(sub)) return main
  }
  return 'Sin categorizar'
}

/** Hex para Recharts — por MainCategory */
export const MAIN_CATEGORY_HEX: Record<MainCategory, string> = {
  Alimentación: '#f97316',
  Transporte: '#10b981',
  Hogar: '#84cc16',
  Salud: '#3b82f6',
  Vestuario: '#ec4899',
  Ocio: '#8b5cf6',
  Tecnología: '#a855f7',
  Deudas: '#ef4444',
  Transferencias: '#64748b',
  'Sin categorizar': '#94a3b8',
}

/** Clases Tailwind bg-* — por MainCategory */
export const MAIN_CATEGORY_COLORS: Record<MainCategory, string> = {
  Alimentación: 'bg-orange-500',
  Transporte: 'bg-emerald-500',
  Hogar: 'bg-lime-500',
  Salud: 'bg-blue-500',
  Vestuario: 'bg-pink-500',
  Ocio: 'bg-violet-500',
  Tecnología: 'bg-purple-500',
  Deudas: 'bg-red-500',
  Transferencias: 'bg-slate-500',
  'Sin categorizar': 'bg-slate-400',
}

export interface Transaction {
  id: string
  fecha: string
  desc: string
  cargo: number
  abono: number
  cat: SubCategory
  catOverride?: SubCategory
  month: string
}

export interface MonthData {
  label: string
  transactions: Transaction[]
  uploadedAt: string
}

export function effectiveCategory(t: Transaction): SubCategory {
  return t.catOverride ?? t.cat
}
