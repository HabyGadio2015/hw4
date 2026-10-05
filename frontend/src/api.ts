import type { ChatMessage, ProductDetail, ProductSummary, SignupInput, User } from './types'

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

export const fetchProducts = () => getJson<ProductSummary[]>('/api/products')

export const fetchProduct = (id: string) => getJson<ProductDetail>(`/api/products/${encodeURIComponent(id)}`)

// ---------- Auth (session lives in an HttpOnly cookie set by the backend) ----------

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    const detail = typeof data?.detail === 'string' ? data.detail : 'Something went wrong. Please try again.'
    throw new Error(detail)
  }
  return (res.status === 204 ? undefined : await res.json()) as T
}

export const login = (email: string, password: string) => postJson<User>('/api/auth/login', { email, password })

export const signup = (input: SignupInput) => postJson<User>('/api/auth/signup', input)

export const logout = () => postJson<void>('/api/auth/logout')

export async function fetchMe(): Promise<User | null> {
  const res = await fetch('/api/auth/me')
  return res.ok ? ((await res.json()) as User) : null
}

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
