import type { MerchantAlias } from '../types'
import { COMMUNITY_MERCHANTS } from '../data/communityMerchants'

/**
 * Devuelve true si la descripción bancaria coincide con algún patrón del alias.
 * Comparación case-insensitive, contains.
 */
export function matchesMerchant(
  desc: string,
  alias: Pick<MerchantAlias, 'patterns'>,
): boolean {
  const lower = desc.toLowerCase()
  return alias.patterns.some((p) => lower.includes(p.toLowerCase()))
}

/**
 * Busca el MerchantAlias para una descripción bancaria.
 * Los aliases de usuario tienen prioridad sobre los de la comunidad.
 * Devuelve null si no hay match.
 *
 * IMPORTANTE: esta función es display-only.
 * No modifica Transaction.cat ni Transaction.catOverride.
 */
export function resolveMerchant(
  desc: string,
  userMerchants: MerchantAlias[],
): MerchantAlias | null {
  const userMatch = userMerchants.find((m) => matchesMerchant(desc, m))
  if (userMatch) return userMatch
  return COMMUNITY_MERCHANTS.find((m) => matchesMerchant(desc, m)) ?? null
}
