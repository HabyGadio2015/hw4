import type { ChatMessage, ProductDetail, ProductSummary } from './types'

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

export const fetchProducts = () => getJson<ProductSummary[]>('/api/products')

export const fetchProduct = (id: string) => getJson<ProductDetail>(`/api/products/${encodeURIComponent(id)}`)

export const formatPrice = (price: number) => `$${price.toFixed(2)}`

// Chat stub: the agent endpoint (POST /api/chat) arrives in a later problem.
// Until then this returns a placeholder reply without calling the backend.
export async function sendChat(_history: ChatMessage[]): Promise<ChatMessage> {
  await new Promise((r) => setTimeout(r, 400))
  return {
    role: 'assistant',
    content: 'Thanks for your message! Our Campus Customs assistant is coming soon — for now, browse the Products page.',
  }
}
