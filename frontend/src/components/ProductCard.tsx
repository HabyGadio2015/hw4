import { Link } from 'react-router-dom'
import { formatPrice } from '../api'
import type { ProductSummary } from '../types'

export default function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link to={`/products/${product.product_id}`} className="product-card">
      <div className="product-image">
        <img src={product.image_url} alt={product.name} loading="lazy" />
        {!product.in_stock && <span className="badge">Sold out</span>}
      </div>
      <div className="product-info">
        <h3>{product.name}</h3>
        <p className="product-price">{formatPrice(product.price)}</p>
        <p className="product-desc">{product.description}</p>
      </div>
    </Link>
  )
}
