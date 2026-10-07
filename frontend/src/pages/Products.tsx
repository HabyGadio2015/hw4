import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { fetchProducts } from '../api'
import { categoryOf } from '../categories'
import type { ProductSummary } from '../types'

type Sort = 'name' | 'price-asc' | 'price-desc'

export default function Products() {
  const [products, setProducts] = useState<ProductSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [category, setCategory] = useState('All')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [sort, setSort] = useState<Sort>('name')

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(() => setError('We couldn’t load the catalogue. Is the backend running?'))
  }, [])

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of products ?? []) {
      const c = categoryOf(p.garment_type)
      counts.set(c, (counts.get(c) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [products])

  const visible = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    const list = (products ?? []).filter((p) => {
      if (category !== 'All' && categoryOf(p.garment_type) !== category) return false
      if (inStockOnly && !p.in_stock) return false
      const haystack = `${p.name} ${p.garment_type} ${p.description}`.toLowerCase()
      return words.every((w) => haystack.includes(w))
    })
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name))
    if (sort === 'price-desc') list.sort((a, b) => b.price - a.price || a.name.localeCompare(b.name))
    return list
  }, [products, query, category, inStockOnly, sort])

  const filtersActive = query !== '' || category !== 'All' || inStockOnly || sort !== 'name'
  const clearFilters = () => {
    setQuery('')
    setCategory('All')
    setInStockOnly(false)
    setSort('name')
  }

  return (
    <section className="section page">
      <h1 className="page-title">Products</h1>
      <p className="lead">Browse hoodies, crewnecks, tees, and jackets from the Campus Customs catalogue.</p>

      {error && <div className="placeholder">{error}</div>}
      {!error && !products && <div className="placeholder">Loading products…</div>}
      {products && (
        <>
          <div className="finder">
            <input
              className="finder-search"
              type="search"
              placeholder={`Search ${products.length} products (try “navy hoodie” or “Berkeley”)`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search products"
            />
            <div className="finder-pills" role="group" aria-label="Category">
              <button className={category === 'All' ? 'pill active' : 'pill'} onClick={() => setCategory('All')}>
                All <span>{products.length}</span>
              </button>
              {categories.map(([name, count]) => (
                <button key={name} className={category === name ? 'pill active' : 'pill'} onClick={() => setCategory(name)}>
                  {name} <span>{count}</span>
                </button>
              ))}
            </div>
            <div className="finder-row">
              <label className="finder-check">
                <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
                In stock only
              </label>
              <label className="finder-sort">
                Sort
                <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                  <option value="name">A–Z</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                </select>
              </label>
              <span className="muted result-count">
                Showing {visible.length} of {products.length} products
              </span>
              {filtersActive && (
                <button className="finder-clear" onClick={clearFilters}>
                  Clear filters ×
                </button>
              )}
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="placeholder">
              No products match those filters. Try a different word, or{' '}
              <button className="finder-clear" onClick={clearFilters}>
                clear filters
              </button>
              .
            </div>
          ) : (
            <div className="product-grid">
              {visible.map((p) => (
                <ProductCard key={p.product_id} product={p} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
