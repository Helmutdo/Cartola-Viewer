const OLLAMA_URL = '/api/ollama/api/generate'
const MODEL = 'llama3.2'

export interface AiResult {
  desc: string
  category: string
}

const VALID_CATEGORIES = [
  'Supermercado', 'Restaurante', 'Delivery', 'Cafetería',
  'Bencina', 'Estacionamiento', 'Taxi / Uber', 'Locomoción',
  'Arriendo', 'Servicios básicos', 'Ferretería',
  'Farmacia', 'Médico', 'Óptica', 'Gimnasio', 'Dentista',
  'Ropa', 'Calzado', 'Accesorios',
  'Streaming', 'Videojuegos', 'Salidas',
  'Software / Suscripción', 'Hardware',
  'Colegio / Universidad', 'Cursos', 'Libros', 'Útiles',
  'Tarjeta CMR', 'Crédito',
  'Transferencia enviada', 'Transferencia recibida',
  'Sin categorizar',
]

function buildPrompt(descriptions: string[]): string {
  const items = descriptions.map((d, i) => `[${i}] "${d}"`).join('\n')
  return `Eres un experto en finanzas personales chilenas. Categoriza cada gasto bancario en UNA de las categorías válidas.
Categorías válidas: ${VALID_CATEGORIES.join(', ')}.
Reglas:
- Supermercados: Lider, Jumbo, Santa Isabel, Unimarc, Tottus, Walmart, Cencosud, Acuenta
- Bencina: Copec, Shell, Petrobras, Enex
- Restaurante si menciona comida preparada
- Delivery si es Rappi, PedidosYa, Uber Eats
- Streaming: Netflix, Spotify, Disney+, HBO, YouTube Premium
- Servicios básicos: cuentas de luz, agua, gas, internet, telefonía, Entel, Movistar, Claro, VTR
- Farmacia: Cruz Verde, Salcobrand, Ahumada
- Ropa: Falabella, Ripley, Paris, Zara, H&M
- Transferencia enviada si es TRANSF PARA
- Transferencia recibida si es TRANSF DE o DEPOSITO
- Si es Webpay, Transbank, MercadoPago, Flow → Sin categorizar (necesita revisión humana)
- Si no sabes con certeza → Sin categorizar
- Tarjeta CMR si menciona PAGO TARJETA CMR

Responde SOLO con una línea por item en este formato exacto:
[0] Categoría
[1] Categoría
...

Sin explicaciones, sin texto adicional.

${items}`
}

function parseResponse(text: string, count: number): (string | null)[] {
  const out: (string | null)[] = new Array(count).fill(null)
  const re = /\[(\d+)\]\s*(.+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const idx = parseInt(m[1], 10)
    if (idx < 0 || idx >= count) continue
    const cat = m[2].trim()
    const matched = VALID_CATEGORIES.find(
      (v) => cat.toUpperCase() === v.toUpperCase(),
    )
    if (matched) out[idx] = matched
  }
  return out
}

export async function aiCategorize(
  descriptions: string[],
  onProgress?: (done: number, total: number) => void,
): Promise<AiResult[]> {
  if (descriptions.length === 0) return []

  const prompt = buildPrompt(descriptions)

  const res = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
      options: { temperature: 0.1, num_predict: 2048 },
    }),
  })

  if (!res.ok) {
    throw new Error(`Ollama error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  const raw = (data.response ?? '') as string
  const parsed = parseResponse(raw, descriptions.length)

  const results: AiResult[] = descriptions.map((desc, i) => ({
    desc,
    category: parsed[i] ?? 'Sin categorizar',
  }))

  onProgress?.(descriptions.length, descriptions.length)
  return results
}
