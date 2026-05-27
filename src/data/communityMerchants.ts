import type { MerchantAlias } from '../types'

/** Tipo de entrada sin campos autogenerados */
type CommunityEntry = Omit<MerchantAlias, 'id' | 'createdAt' | 'updatedAt' | 'source'>

/** Genera un MerchantAlias completo a partir de una entrada parcial */
function seed(entries: CommunityEntry[]): MerchantAlias[] {
  return entries.map((e) => ({
    ...e,
    id: `community__${e.displayName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    source: 'community' as const,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }))
}

/**
 * Base bundleada de comercios chilenos comunes.
 * source = 'community'. El usuario puede crear aliases propios que los sobreescriben.
 */
const ENTRIES: CommunityEntry[] = [
  // ── Supermercados ────────────────────────────────────────────────────────────
  { displayName: 'Lider',         patterns: ['WALMART CHILE', 'WAL-MART', 'LIDER'],             defaultCategory: 'Supermercado' },
  { displayName: 'Jumbo',         patterns: ['CENCOSUD RETAIL JUMBO', 'JUMBO'],                 defaultCategory: 'Supermercado' },
  { displayName: 'Santa Isabel',  patterns: ['CENCOSUD RETAIL SANTA', 'SANTA ISABEL'],          defaultCategory: 'Supermercado' },
  { displayName: 'Unimarc',       patterns: ['SMU S.A', 'SMU SA', 'UNIMARC'],                   defaultCategory: 'Supermercado' },
  { displayName: 'Tottus',        patterns: ['TOTTUS', 'FALABELLA TOTTUS'],                     defaultCategory: 'Supermercado' },
  { displayName: 'Acuenta',       patterns: ['ACUENTA'],                                        defaultCategory: 'Supermercado' },
  // ── Retail / Tiendas ─────────────────────────────────────────────────────────
  { displayName: 'Falabella',     patterns: ['FALABELLA RETAIL', 'SAGA FALABELLA'],             defaultCategory: 'Ropa' },
  { displayName: 'Paris',         patterns: ['CENCOSUD RETAIL PARIS', 'PARIS'],                 defaultCategory: 'Ropa' },
  { displayName: 'Ripley',        patterns: ['COMERCIAL ECCSA', 'RIPLEY'],                      defaultCategory: 'Ropa' },
  { displayName: 'H&M',           patterns: ['H&M', 'H AND M'],                                defaultCategory: 'Ropa' },
  { displayName: 'Zara',          patterns: ['ZARA'],                                           defaultCategory: 'Ropa' },
  { displayName: 'Corona',        patterns: ['CORONA LTDA', 'CORONA S.A'],                     defaultCategory: 'Ropa' },
  { displayName: 'Forus',         patterns: ['FORUS'],                                          defaultCategory: 'Calzado' },
  // ── Combustible ──────────────────────────────────────────────────────────────
  { displayName: 'Copec',         patterns: ['COPEC'],                                          defaultCategory: 'Bencina' },
  { displayName: 'Shell',         patterns: ['SHELL'],                                          defaultCategory: 'Bencina' },
  { displayName: 'Petrobras',     patterns: ['PETROBRAS'],                                      defaultCategory: 'Bencina' },
  { displayName: 'Enex',          patterns: ['ENEX'],                                           defaultCategory: 'Bencina' },
  // ── Delivery / Comida ────────────────────────────────────────────────────────
  { displayName: 'Rappi',         patterns: ['RAPPI'],                                          defaultCategory: 'Delivery' },
  { displayName: 'PedidosYa',     patterns: ['PEDIDOSYA', 'PEDIDOS YA'],                        defaultCategory: 'Delivery' },
  { displayName: 'Uber Eats',     patterns: ['UBEREATS', 'UBER EATS'],                          defaultCategory: 'Delivery' },
  // ── Transporte ───────────────────────────────────────────────────────────────
  { displayName: 'Uber',          patterns: ['UBER'],                                           defaultCategory: 'Taxi / Uber' },
  { displayName: 'Cabify',        patterns: ['CABIFY'],                                         defaultCategory: 'Taxi / Uber' },
  { displayName: 'inDriver',      patterns: ['INDRIVER'],                                       defaultCategory: 'Taxi / Uber' },
  // ── Farmacias ────────────────────────────────────────────────────────────────
  { displayName: 'Cruz Verde',    patterns: ['CRUZ VERDE', 'CRUZVERDE'],                        defaultCategory: 'Farmacia' },
  { displayName: 'Salcobrand',    patterns: ['SALCOBRAND'],                                     defaultCategory: 'Farmacia' },
  { displayName: 'Ahumada',       patterns: ['FARMACIAS AHUMADA', 'AHUMADA'],                   defaultCategory: 'Farmacia' },
  // ── Streaming / Suscripciones ────────────────────────────────────────────────
  { displayName: 'Netflix',           patterns: ['NETFLIX'],                                    defaultCategory: 'Software / Suscripción' },
  { displayName: 'Spotify',           patterns: ['SPOTIFY'],                                    defaultCategory: 'Software / Suscripción' },
  { displayName: 'Disney+',           patterns: ['DISNEY PLUS', 'DISNEY+', 'DISNEYPLUS'],       defaultCategory: 'Software / Suscripción' },
  { displayName: 'Amazon Prime',      patterns: ['AMAZON PRIME', 'AMAZON.COM'],                defaultCategory: 'Software / Suscripción' },
  { displayName: 'YouTube Premium',   patterns: ['GOOGLE YOUTUBE', 'YOUTUBE'],                 defaultCategory: 'Software / Suscripción' },
  { displayName: 'Adobe',             patterns: ['ADOBE'],                                      defaultCategory: 'Software / Suscripción' },
  { displayName: 'Cursor',            patterns: ['CURSOR'],                                     defaultCategory: 'Software / Suscripción' },
  { displayName: 'Apple',             patterns: ['APPLE.COM', 'APPLE STORE', 'ITUNES'],        defaultCategory: 'Software / Suscripción' },
  { displayName: 'Microsoft',         patterns: ['MICROSOFT'],                                  defaultCategory: 'Software / Suscripción' },
  { displayName: 'Google',            patterns: ['GOOGLE'],                                     defaultCategory: 'Software / Suscripción' },
  { displayName: 'HBO Max',           patterns: ['HBO MAX', 'MAX.COM'],                         defaultCategory: 'Software / Suscripción' },
  { displayName: 'Paramount+',        patterns: ['PARAMOUNT'],                                  defaultCategory: 'Software / Suscripción' },
  // ── Telefonía / Internet ─────────────────────────────────────────────────────
  { displayName: 'Entel',        patterns: ['ENTEL'],                                           defaultCategory: 'Servicios básicos' },
  { displayName: 'Claro',        patterns: ['CLARO CHILE', 'AMX CHILE'],                       defaultCategory: 'Servicios básicos' },
  { displayName: 'Movistar',     patterns: ['MOVISTAR', 'TELEFONICA'],                          defaultCategory: 'Servicios básicos' },
  { displayName: 'WOM',          patterns: ['WOM'],                                             defaultCategory: 'Servicios básicos' },
  { displayName: 'VTR',          patterns: ['VTR'],                                             defaultCategory: 'Servicios básicos' },
  { displayName: 'GTD',          patterns: ['GTD'],                                             defaultCategory: 'Servicios básicos' },
  // ── Servicios básicos ────────────────────────────────────────────────────────
  { displayName: 'Servipag',     patterns: ['SERVIPAG'],                                        defaultCategory: 'Servicios básicos' },
  { displayName: 'Chilectra',    patterns: ['CHILECTRA', 'ENEL'],                               defaultCategory: 'Servicios básicos' },
  { displayName: 'Aguas Andinas',patterns: ['AGUAS ANDINAS'],                                  defaultCategory: 'Servicios básicos' },
  { displayName: 'Metrogas',     patterns: ['METROGAS'],                                        defaultCategory: 'Servicios básicos' },
  { displayName: 'CGE',          patterns: ['CGE DISTRIBUCION', 'CGE'],                         defaultCategory: 'Servicios básicos' },
  // ── Salud ────────────────────────────────────────────────────────────────────
  { displayName: 'Banmédica',    patterns: ['BANMEDICA'],                                       defaultCategory: 'Médico' },
  { displayName: 'Cruz Blanca',  patterns: ['CRUZ BLANCA'],                                    defaultCategory: 'Médico' },
  { displayName: 'Fonasa',       patterns: ['FONASA'],                                          defaultCategory: 'Médico' },
  // ── Educación ────────────────────────────────────────────────────────────────
  { displayName: 'Udemy',        patterns: ['UDEMY'],                                           defaultCategory: 'Cursos' },
  { displayName: 'Coursera',     patterns: ['COURSERA'],                                        defaultCategory: 'Cursos' },
  // ── Estacionamiento ──────────────────────────────────────────────────────────
  { displayName: 'Parking Arauco', patterns: ['PARKING ARAUCO', 'ARAUCO PARKING'],             defaultCategory: 'Estacionamiento' },
  // ── Hogar / Ferretería ───────────────────────────────────────────────────────
  { displayName: 'Easy',         patterns: ['EASY HOMECENTER', 'CENCOSUD EASY'],               defaultCategory: 'Ferretería' },
  { displayName: 'Sodimac',      patterns: ['SODIMAC', 'HOMECENTER'],                           defaultCategory: 'Ferretería' },
  // ── Gateways — requieren revisión manual ─────────────────────────────────────
  { displayName: '⚠️ Webpay (revisar)',       patterns: ['WEBPAY'],                             defaultCategory: undefined },
  { displayName: '⚠️ Transbank (revisar)',    patterns: ['TRANSBANK'],                          defaultCategory: undefined },
  { displayName: '⚠️ MercadoPago (revisar)',  patterns: ['MERCADOPAGO', 'MERCADO PAGO'],        defaultCategory: undefined },
  { displayName: '⚠️ Flow (revisar)',         patterns: ['FLOW.CL', 'GETFLOW'],                 defaultCategory: undefined },
]

export const COMMUNITY_MERCHANTS: MerchantAlias[] = seed(ENTRIES)
