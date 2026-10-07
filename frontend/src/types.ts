// Shapes returned by the FastAPI backend (backend/main.py).

export interface ProductSummary {
  product_id: string
  name: string
  garment_type: string
  description: string
  price: number
  image_url: string
  in_stock: boolean
  total_in_stock: number
  sizes: SizeStock[]
}

export interface SizeStock {
  size: string
  quantity: number
}

export interface ProductDetail extends ProductSummary {
  colors: string[]
  search_tags: string[]
  inventory: SizeStock[]
}

// A product card returned with a chat reply (built from the database by the backend).
export interface ProductCard {
  product_id: string
  name: string
  garment_type: string
  short_info: string
  colors: string[]
  price: number
  image_url: string
  in_stock: boolean
  sizes_in_stock: string[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  products?: ProductCard[]
  resultsTitle?: string
}

export interface ChatResponse {
  reply: string
  results_title: string | null
  products: ProductCard[]
}

export interface User {
  id: number
  first_name: string | null
  last_name: string | null
  name: string
  email: string
}

export interface SignupInput {
  first_name: string
  last_name: string
  email: string
  password: string
  confirm_password: string
}

// Where the shopper is on the site, sent with each chat message.
export interface PageContext {
  path: string
  product_id?: string
}

// One saved message from GET /api/chat/history.
export interface ChatHistoryItem {
  role: 'user' | 'assistant'
  content: string
  products: ProductCard[]
}
