import { useLayoutEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { formatPrice } from '../api'
import { useResults } from '../results'

export default function ResultsPanel() {
  const { results, clear } = useResults()
  const { pathname } = useLocation()
  const gridRef = useRef<HTMLDivElement>(null)
  // On a single-item page the product itself is the focus; the results stay saved and come back with "Back to chat results".
  const hidden = !results || results.products.length === 0 || /^\/products\/.+/.test(pathname)
  const seq = results?.seq

  // Each card starts at the chat button and flies to its spot on the rail (the CSS animation reads --dx and --dy).
  useLayoutEffect(() => {
    const grid = gridRef.current
    const toggle = document.querySelector('.chat-toggle')
    if (!grid || !toggle) return
    const t = toggle.getBoundingClientRect()
    const cx = t.left + t.width / 2
    const cy = t.top + t.height / 2
    grid.querySelectorAll<HTMLElement>('.result-slot').forEach((el) => {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--dx', `${cx - (r.left + r.width / 2)}px`)
      el.style.setProperty('--dy', `${cy - (r.top + window.scrollY + r.height / 2)}px`)
    })
  }, [seq, hidden])

  if (!results || hidden) return null

  const { title, products } = results
  return (
    <section className="results" aria-label="Chat search results">
      <div className="results-inner">
        <div className="results-head">
          <div>
            <p className="results-caption">
              Hung up {products.length} {products.length === 1 ? 'item' : 'items'} for you
            </p>
            <p className="results-eyebrow">Picked for you by our assistant</p>
            <h2 className="results-title">{title}</h2>
            <p className="results-count">
              {products.length} {products.length === 1 ? 'match' : 'matches'} from the Campus Customs catalogue
            </p>
          </div>
          <button className="results-close" onClick={clear}>
            Clear results ×
          </button>
        </div>
        <div className="results-grid" ref={gridRef} key={results.seq}>
          {products.map((p, i) => (
            <div key={p.product_id} className="result-slot" style={{ ['--i' as string]: i }}>
              <svg className="hook" viewBox="0 0 40 36" aria-hidden="true">
                <rect x="11" y="0" width="18" height="9" rx="3" fill="#8d8d8d" />
                <path d="M20 9 V36" stroke="#6b6f78" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
              <Link to={`/products/${p.product_id}`} className="result-card">
                <div className="result-media">
                  <img src={p.image_url} alt={p.name} loading="lazy" />
                  <span className="result-chip">{p.garment_type}</span>
                  {!p.in_stock && <span className="result-chip result-sold">Sold out</span>}
                </div>
                <div className="result-body">
                  <h3 className="result-name">{p.name}</h3>
                  <p className="result-info">{p.short_info}</p>
                  {p.in_stock && (
                    <div className="result-sizes" aria-label="Sizes in stock">
                      {p.sizes_in_stock.map((s) => (
                        <span key={s} className="result-size">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="result-foot">
                    <span className="result-price">{formatPrice(p.price)}</span>
                    <span className="result-view">View →</span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
