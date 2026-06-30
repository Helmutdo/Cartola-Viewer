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

/** Reglas hardcodeadas de respaldo basadas en patrones reales de Chile. */
export function autoCategorizeFallback(desc: string): SubCategory {
  const u = desc.toUpperCase()

  // ── Transferencias ────────────────────────────────────────────────────────
  if (/\bTRANSF\.?\s+PARA\b/i.test(desc)) return 'Transferencia enviada'
  if (/\bTRANSF\.?\s+DE\b/i.test(desc)) return 'Transferencia recibida'
  if (/\bDEP[ÓO]SITO\b/i.test(desc)) return 'Transferencia recibida'
  if (/\bABONO\b/i.test(desc)) return 'Transferencia recibida'

  // ── Deudas ────────────────────────────────────────────────────────────────
  if (u.includes('PAGO TARJETA CMR') || u.includes('CMR')) return 'Tarjeta CMR'
  if (u.includes('COBRANZA')) return 'Crédito'

  // ── Supermercados ─────────────────────────────────────────────────────────
  if (
    u.includes('LIDER') ||
    u.includes('WALMART') ||
    u.includes('JUMBO') ||
    u.includes('CENCOSUD') ||
    u.includes('SANTA ISABEL') ||
    u.includes('UNIMARC') ||
    u.includes('TOTTUS') ||
    u.includes('ACUENTA') ||
    u.includes('MAYORISTA')
  )
    return 'Supermercado'

  // ── Bencina / Combustible ─────────────────────────────────────────────────
  if (
    u.includes('COPEC') ||
    u.includes('SHELL') ||
    u.includes('PETROBRAS') ||
    u.includes('ENEX') ||
    u.includes('TERPEL')
  )
    return 'Bencina'

  // ── Delivery / Comida a domicilio ─────────────────────────────────────────
  if (u.includes('RAPPI') || u.includes('PEDIDOSYA') || u.includes('UBEREATS') || u.includes('UBER EATS'))
    return 'Delivery'

  // ── Restaurantes y cafetería ──────────────────────────────────────────────
  if (
    u.includes('RESTAURANT') ||
    u.includes('ABUELITA') ||
    u.includes('CAFE') ||
    u.includes('STARBUCKS') ||
    u.includes('MCDONALDS') ||
    u.includes('MCDONALD') ||
    u.includes('KFC') ||
    u.includes('PIZZA') ||
    u.includes('SUSHI') ||
    u.includes('DOG')
  )
    return 'Restaurante'

  // ── Retail / Vestuario ────────────────────────────────────────────────────
  if (
    u.includes('FALABELLA RETAIL') ||
    u.includes('SAGA FALABELLA') ||
    u.includes('RIPLEY') ||
    u.includes('COMERCIAL ECCSA') ||
    u.includes('CENCOSUD RETAIL PARIS') ||
    u.includes('PARIS') ||
    u.includes('ZARA') ||
    u.includes('H&M') ||
    u.includes('CORONA') ||
    u.includes('TRICOT') ||
    u.includes('LAPOLAR') ||
    u.includes('LA POLAR')
  )
    return 'Ropa'

  // ── Farmacias ─────────────────────────────────────────────────────────────
  if (
    u.includes('CRUZ VERDE') ||
    u.includes('CRUZVERDE') ||
    u.includes('SALCOBRAND') ||
    u.includes('FARMACIAS AHUMADA') ||
    u.includes('AHUMADA')
  )
    return 'Farmacia'

  // ── Transporte / Taxis ────────────────────────────────────────────────────
  if (u.includes('UBER') || u.includes('CABIFY') || u.includes('BOLT') || u.includes('INDRIVER'))
    return 'Taxi / Uber'

  // ── Estacionamiento ───────────────────────────────────────────────────────
  if (u.includes('PARKING') || u.includes('EXPRESS VICM') || u.includes('ESTACIONAMIENTO'))
    return 'Estacionamiento'

  // ── Streaming (Ocio) ──────────────────────────────────────────────────────
  if (
    u.includes('NETFLIX') ||
    u.includes('SPOTIFY') ||
    u.includes('DISNEY PLUS') ||
    u.includes('DISNEY+') ||
    u.includes('DISNEYPLUS') ||
    u.includes('HBO MAX') ||
    u.includes('MAX.COM') ||
    u.includes('HBO') ||
    u.includes('PARAMOUNT') ||
    u.includes('YOUTUBE') ||
    u.includes('AMAZON PRIME') ||
    u.includes('PRIME VIDEO') ||
    u.includes('APPLE TV') ||
    u.includes('CRUNCHYROLL')
  )
    return 'Streaming'

  // ── Software / Suscripciones ──────────────────────────────────────────────
  if (
    u.includes('CURSOR') ||
    u.includes('ADOBE') ||
    u.includes('GITHUB') ||
    u.includes('DISCORD') ||
    u.includes('MICROSOFT 365') ||
    u.includes('OFFICE 365') ||
    u.includes('GOOGLE ONE') ||
    u.includes('ICLOUD') ||
    u.includes('DROPBOX')
  )
    return 'Software / Suscripción'

  // ── Telecomunicaciones / Servicios básicos ────────────────────────────────
  if (
    u.includes('ENTEL') ||
    u.includes('CLARO') ||
    u.includes('MOVISTAR') ||
    u.includes('TELEFONICA') ||
    u.includes('WOM') ||
    u.includes('VTR') ||
    u.includes('GTD') ||
    u.includes('SERVIPAG') ||
    u.includes('PAC') ||
    u.includes('CHILECTRA') ||
    u.includes('ENEL') ||
    u.includes('AGUAS ANDINAS') ||
    u.includes('METROGAS') ||
    u.includes('CGE')
  )
    return 'Servicios básicos'

  // ── Hogar / Ferretería ────────────────────────────────────────────────────
  if (
    u.includes('SODIMAC') ||
    u.includes('HOMECENTER') ||
    u.includes('EASY HOMECENTER') ||
    u.includes('CENCOSUD EASY') ||
    u.includes('CONSTRUMART') ||
    u.includes('IMPERIAL')
  )
    return 'Ferretería'

  // ── Salud ─────────────────────────────────────────────────────────────────
  if (u.includes('BANMEDICA') || u.includes('CRUZ BLANCA') || u.includes('FONASA') || u.includes('ISAPRE'))
    return 'Médico'

  // ── Educación / Cursos ────────────────────────────────────────────────────
  if (u.includes('UDEMY') || u.includes('COURSERA') || u.includes('PLATZI') || u.includes('DOMESTIKA'))
    return 'Cursos'

  // ── Gimnasio ──────────────────────────────────────────────────────────────
  if (u.includes('GIMNASIO') || u.includes('SMART FIT') || u.includes('PACIFIC') || u.includes('ENERGY'))
    return 'Gimnasio'

  // ── Ambiguos (pasarelas de pago, etc.) → dejar para revisión manual ──────
  if (
    u.includes('MERCADOPAGO') ||
    u.includes('MERCADO PAGO') ||
    u.includes('WEBPAY') ||
    u.includes('TRANSBANK') ||
    u.includes('REDGLOBA') ||
    u.includes('KHIPU') ||
    u.includes('FLOW') ||
    u.includes('GETFLOW')
  )
    return 'Sin categorizar'

  // Hoteles / viajes → revisión manual
  if (u.includes('HOTEL') || u.includes('REFUGIO') || u.includes('HOSTAL') || u.includes('AIRBNB') || u.includes('DESPEGAR') || u.includes('LATAM') || u.includes('SKY AIRLINE'))
    return 'Sin categorizar'

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
