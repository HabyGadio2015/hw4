import { Link } from 'react-router-dom'
import { formatPrice } from '../api'
import { useResults } from '../results'

export default function ResultsPanel() {
  const { results, clear } = useResults()
  if (!results || results.products.length === 0) return null

  const { title, products } = results
  return (
    <section className="results" aria-label="Chat search results">
      <div className="results-inner">
        <div className="results-head">
          <div>
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
        <div className="results-grid">
          {products.map((p, i) => (
            <Link
              key={p.product_id}
              to={`/products/${p.product_id}`}
              className="result-card"
              style={{ ['--i' as string]: i }}
            >
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
          ))}
        </div>
      </div>
    </section>
  )
}
