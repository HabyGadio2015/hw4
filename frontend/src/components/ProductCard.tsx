import { useCallback, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../api'
import { useTheme } from '../theme'
import QuickView from './QuickView'
import type { ProductSummary } from '../types'

const LOW_STOCK = 5

// A garment on a hanger with a paper price tag. Honest stock: every size chip and the meter come from the database.
export default function ProductCard({ product }: { product: ProductSummary }) {
  const { calm } = useTheme()
  const [quick, setQuick] = useState(false)
  const closeQuick = useCallback(() => setQuick(false), [])
  const cardRef = useRef<HTMLDivElement>(null)

  const inStock = product.sizes.filter((s) => s.quantity > 0)
  const anyLow = inStock.some((s) => s.quantity <= LOW_STOCK)
  const stockLine = !product.in_stock
    ? 'Sold out in every size'
    : `${inStock.length} of ${product.sizes.length} sizes in stock${anyLow ? ' · low in some' : ''}`

  // Tilt and shine follow the mouse. Skipped for touch and in Calm mode.
  function onMove(e: ReactPointerEvent<HTMLDivElement>) {
    const el = cardRef.current
    if (calm || e.pointerType !== 'mouse' || !el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    el.style.setProperty('--ry', `${(px - 0.5) * 10}deg`)
    el.style.setProperty('--rx', `${(0.5 - py) * 8}deg`)
    el.style.setProperty('--mx', `${px * 100}%`)
    el.style.setProperty('--my', `${py * 100}%`)
  }

  function onLeave() {
    const el = cardRef.current
    if (!el) return
    for (const name of ['--rx', '--ry', '--mx', '--my']) el.style.removeProperty(name)
  }

  return (
    <div className="hang-slot">
      <svg className="hook" viewBox="0 0 40 36" aria-hidden="true">
        <rect x="11" y="0" width="18" height="9" rx="3" fill="#8d8d8d" />
        <path d="M20 9 V36" stroke="#6b6f78" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <div className="hang-card" ref={cardRef} onPointerMove={onMove} onPointerLeave={onLeave}>
        <Link to={`/products/${product.product_id}`} className="hang-link">
          <div className="hang-photo">
            <img src={product.image_url} alt={product.name} loading="lazy" />
            <span className="shine" aria-hidden="true" />
            {!product.in_stock && <span className="stamp">SOLD OUT</span>}
            <span className="price-tag">
              <span className="tag-hole" aria-hidden="true" />
              {formatPrice(product.price)}
            </span>
          </div>
          <div className="hang-body">
            <h3>{product.name}</h3>
            <p className="hang-desc">{product.description}</p>
            <div className="size-chips">
              {product.sizes.map((s) => (
                <span
                  key={s.size}
                  className={`size-chip ${s.quantity === 0 ? 'out' : s.quantity <= LOW_STOCK ? 'low' : ''}`}
                  title={s.quantity === 0 ? `${s.size}: out of stock` : `${s.size}: ${s.quantity} in stock`}
                >
                  {s.size}
                </span>
              ))}
            </div>
            <div
              className="stock-meter"
              role="img"
              aria-label={`${inStock.length} of ${product.sizes.length} sizes in stock`}
            >
              <span style={{ width: `${(inStock.length / Math.max(product.sizes.length, 1)) * 100}%` }} />
            </div>
            <p className="stock-line">{stockLine}</p>
          </div>
        </Link>
        <button type="button" className="quick-btn" onClick={() => setQuick(true)}>
          Quick look
        </button>
      </div>
      {quick && <QuickView productId={product.product_id} onClose={closeQuick} />}
    </div>
  )
}
