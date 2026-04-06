import type { SubCategory } from '../types'

export interface CategoryRule {
  id: string
  pattern: string
  matchType: 'contains' | 'startsWith' | 'exact'
  category: SubCategory
  createdAt: string
}

/** Aplica reglas en orden. Retorna la primera que hace match (case-insensitive) o null. */
export function applyRules(desc: string, rules: CategoryRule[]): SubCategory | null {
  const lower = desc.toLowerCase()
  for (const rule of rules) {
    const pattern = rule.pattern.toLowerCase()
    let matches = false
    if (rule.matchType === 'contains') {
      matches = lower.includes(pattern)
    } else if (rule.matchType === 'startsWith') {
      matches = lower.startsWith(pattern)
    } else {
      // exact
      matches = lower === pattern
    }
    if (matches) return rule.category
  }
  return null
}

/** Reglas hardcodeadas de respaldo. */
export function autoCategorizeFallback(desc: string): SubCategory {
  const u = desc.toUpperCase()

  if (/\bTRANSF\.?\s+PARA\b/i.test(desc)) return 'Transferencia enviada'
  if (/\bTRANSF\.?\s+DE\b/i.test(desc)) return 'Transferencia recibida'

  if (u.includes('PAGO TARJETA CMR')) return 'Tarjeta CMR'

  if (u.includes('COPEC') || u.includes('SHELL') || u.includes('PETROBRAS')) return 'Bencina'

  if (u.includes('RESTAURANT') || u.includes('ABUELITA') || u.includes('CAFE')) return 'Restaurante'

  if (
    u.includes('LIDER') ||
    u.includes('JUMBO') ||
    u.includes('SANTA ISABEL') ||
    u.includes('UNIMARC') ||
    u.includes('TOTTUS') ||
    u.includes('WALMART')
  )
    return 'Supermercado'

  if (u.includes('RAPPI') || u.includes('PEDIDOSYA') || u.includes('UBEREATS')) return 'Delivery'

  if (u.includes('PARKING') || u.includes('EXPRESS VICM')) return 'Estacionamiento'

  if (u.includes('UBER') || u.includes('CABIFY') || u.includes('BOLT')) return 'Taxi / Uber'

  if (u.includes('CURSOR') || u.includes('ADOBE') || u.includes('SPOTIFY') || u.includes('NETFLIX'))
    return 'Software / Suscripción'

  if (u.includes('SERVIPAG') || u.includes('PAC')) return 'Servicios básicos'

  // Ambiguos → dejar para revisión manual
  if (u.includes('MERCADOPAGO') || u.includes('WEBPAY') || u.includes('REDGLOBA')) return 'Sin categorizar'
  if (u.includes('HOTEL') || u.includes('REFUGIO') || u.includes('HOSTAL')) return 'Sin categorizar'

  return 'Sin categorizar'
}

/**
 * 1. Aplica reglas del usuario.
 * 2. Si no hay match, usa autoCategorizeFallback.
 * Nunca retorna null.
 */
export function categorize(desc: string, rules: CategoryRule[]): SubCategory {
  return applyRules(desc, rules) ?? autoCategorizeFallback(desc)
}
