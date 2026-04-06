// MainCategory y SubCategory son strings dinámicos (vienen del CategoryTree en localStorage)
export type SubCategory = string
export type MainCategory = string

export interface SubCategoryDefinition {
  id: string
  name: string
}

export interface CategoryDefinition {
  id: string
  name: string
  color: string
  subcategories: SubCategoryDefinition[]
}

export type CategoryTree = CategoryDefinition[]

/** Dada una subcategoría, retorna su categoría principal usando el tree dinámico */
export function getMainCategory(sub: string, tree: CategoryTree): string {
  for (const cat of tree) {
    if (cat.subcategories.some((s) => s.name === sub)) return cat.name
  }
  return 'Sin categorizar'
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
