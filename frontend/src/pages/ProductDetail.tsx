import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchProduct, formatPrice } from '../api'
import { useResults } from '../results'
import type { ProductDetail as Product } from '../types'

const LOW_STOCK = 5

function stockLabel(quantity: number) {
  if (quantity === 0) return 'Out of stock'
  if (quantity <= LOW_STOCK) return `Only ${quantity} left`
  return `${quantity} in stock`
}

export default function ProductDetail() {
  const { productId = '' } = useParams()
  const { results } = useResults()
  // Results are tagged with the id they belong to, so a stale result never shows for a new product.
  const [result, setResult] = useState<{ id: string; product?: Product; error?: string } | null>(null)

  useEffect(() => {
    fetchProduct(productId)
      .then((product) => setResult({ id: productId, product }))
      .catch(() => setResult({ id: productId, error: 'Sorry, we couldn’t find that product.' }))
  }, [productId])

  const current = result?.id === productId ? result : null
  const product = current?.product ?? null
  const error = current?.error ?? null

  return (
    <section className="section page">
      <div className="back-links">
        <Link to="/products" className="back-link">
          ← Back to Products
        </Link>
        {results && results.products.length > 0 && (
          <Link to="/products" className="back-link">
            ← Back to chat results: {results.title}
          </Link>
        )}
      </div>

      {error && <div className="placeholder">{error}</div>}
      {!error && !product && <div className="placeholder">Loading…</div>}
      {product && (
        <div className="detail">
          <div className="detail-image">
            <img src={product.image_url} alt={product.name} />
          </div>
          <div className="detail-info">
            <p className="eyebrow detail-type">{product.garment_type}</p>
            <h1>{product.name}</h1>
            <p className="detail-price">{formatPrice(product.price)}</p>
            <p className="detail-desc">{product.description}</p>

            <h3>Colors</h3>
            <p className="muted">{product.colors.join(', ')}</p>

            <h3>Size &amp; stock</h3>
            <div className="size-grid">
              {product.inventory.map((s) => (
                <div key={s.size} className={s.quantity === 0 ? 'size-cell out' : 'size-cell'}>
                  <span className="size-name">{s.size}</span>
                  <span className="size-qty">{stockLabel(s.quantity)}</span>
                </div>
              ))}
            </div>
            {!product.in_stock && <p className="muted">This item is currently sold out in every size.</p>}
          </div>
        </div>
      )}
    </section>
  )
}
