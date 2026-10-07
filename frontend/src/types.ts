// Shapes returned by the FastAPI backend (backend/main.py).

export interface ProductSummary {
  product_id: string
  name: string
  garment_type: string
  description: string
  price: number
  image_url: string
  in_stock: boolean
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
  price: number
  image_url: string
  in_stock: boolean
  sizes_in_stock: string[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  products?: ProductCard[]
}

export interface ChatResponse {
  reply: string
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
