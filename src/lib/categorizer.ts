import type { Category } from '../types'

export function autoCategorize(desc: string): Category {
  const u = desc.toUpperCase()

  if (/\bTRANSF\.?\s+PARA\b/i.test(desc)) return 'Transferencia enviada'
  if (/\bTRANSF\.?\s+DE\b/i.test(desc)) return 'Transferencia recibida'

  if (u.includes('PAGO TARJETA CMR')) return 'Tarjeta CMR'

  if (u.includes('COPEC') || u.includes('SHELL')) return 'Bencina'

  if (
    u.includes('RESTAURANT') ||
    u.includes('ABUELITA') ||
    u.includes('FOOD') ||
    u.includes('CAFE') ||
    u.includes('PIZZA')
  ) {
    return 'Comida'
  }

  if (
    u.includes('PARKING') ||
    u.includes('EXPRESS VICM') ||
    u.includes('UBER') ||
    u.includes('CABIFY')
  ) {
    return 'Transporte'
  }

  if (u.includes('HOTEL') || u.includes('REFUGIO') || u.includes('HOSTAL')) {
    return 'Alojamiento'
  }

  if (
    u.includes('CURSOR') ||
    u.includes('ADOBE') ||
    u.includes('SPOTIFY') ||
    u.includes('NETFLIX') ||
    u.includes('SOFTWARE')
  ) {
    return 'Tecnología'
  }

  if (
    u.includes('MERCADOPAGO') ||
    u.includes('WEBPAY') ||
    u.includes('REDGLOBA') ||
    u.includes('REDCOMPRA')
  ) {
    return 'Compras'
  }

  if (u.includes('SERVIPAG') || u.includes('PAC') || u.includes('SERVICIO')) {
    return 'Servicios'
  }

  return 'Otros'
}
