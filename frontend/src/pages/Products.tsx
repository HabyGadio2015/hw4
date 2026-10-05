import { useEffect, useState } from 'react'
import ProductCard from '../components/ProductCard'
import { fetchProducts } from '../api'
import type { ProductSummary } from '../types'

export default function Products() {
  const [products, setProducts] = useState<ProductSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(() => setError('We couldn’t load the catalogue. Is the backend running?'))
  }, [])

  return (
    <section className="section page">
      <h1 className="page-title">Products</h1>
      <p className="lead">Browse hoodies, crewnecks, tees, and jackets from the Campus Customs catalogue.</p>

      {error && <div className="placeholder">{error}</div>}
      {!error && !products && <div className="placeholder">Loading products…</div>}
      {products && (
        <>
          <p className="muted result-count">{products.length} products</p>
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p.product_id} product={p} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
