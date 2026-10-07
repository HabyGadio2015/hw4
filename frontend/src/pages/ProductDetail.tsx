import { useEffect, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchProduct, formatPrice } from '../api'
import { useChatBridge } from '../chatbridge'
import ColorDots from '../components/ColorDots'
import { DetailSkeleton } from '../components/Skeletons'
import { useResults } from '../results'
import type { ProductDetail as Product, SizeStock } from '../types'

const LOW_STOCK = 5
const SHELF_FULL = 25 // the stock bar is scaled so 25 units fills it; the number shown is always the real quantity

function stockLabel(quantity: number) {
  if (quantity === 0) return 'Out of stock'
  if (quantity <= LOW_STOCK) return `Only ${quantity} left`
  return `${quantity} in stock`
}

// Hover the photo to zoom in on the spot under the mouse (mouse only).
function Magnifier({ src, alt }: { src: string; alt: string }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  function onMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
  }

  return (
    <div className="magnifier" onPointerMove={onMove} onPointerLeave={() => setPos(null)}>
      <img src={src} alt={alt} />
      {pos && <div className="magnifier-zoom" style={{ backgroundImage: `url(${src})`, backgroundPosition: `${pos.x}% ${pos.y}%` }} />}
      <span className="magnifier-hint">Hover to zoom</span>
    </div>
  )
}

// Pick a size to see how many are on the shelf; the bar animates to the real quantity.
function SizePicker({ sizes }: { sizes: SizeStock[] }) {
  const [selected, setSelected] = useState<string | null>(null)
  const chosen = sizes.find((s) => s.size === selected) ?? null
  const level = !chosen ? '' : chosen.quantity === 0 ? 'out' : chosen.quantity <= LOW_STOCK ? 'low' : 'ok'

  return (
    <>
      <div className="size-picker" role="group" aria-label="Sizes">
        {sizes.map((s) => (
          <button
            key={s.size}
            className={`size-btn ${s.quantity === 0 ? 'out' : ''} ${selected === s.size ? 'on' : ''}`}
            aria-pressed={selected === s.size}
            onClick={() => setSelected(s.size)}
          >
            {s.size}
          </button>
        ))}
      </div>
      <div className={`size-readout ${level}`} aria-live="polite">
        <p>{chosen ? `${chosen.size}: ${stockLabel(chosen.quantity)}` : 'Pick a size to see how many are on the shelf.'}</p>
        <div className="size-bar">
          <span style={{ width: chosen ? `${(Math.min(chosen.quantity, SHELF_FULL) / SHELF_FULL) * 100}%` : '0%' }} />
        </div>
      </div>
    </>
  )
}

export default function ProductDetail() {
  const { productId = '' } = useParams()
  const { results } = useResults()
  const { ask } = useChatBridge()
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
      {!error && !product && <DetailSkeleton />}
      {product && (
        <div className="detail">
          <div className="detail-image">
            <Magnifier src={product.image_url} alt={product.name} />
          </div>
          <div className="detail-info">
            <p className="eyebrow detail-type">{product.garment_type}</p>
            <h1>{product.name}</h1>
            <p className="detail-price">{formatPrice(product.price)}</p>
            <p className="detail-desc">{product.description}</p>

            <h3>Colors</h3>
            <ColorDots colors={product.colors} />

            <h3>Size &amp; stock</h3>
            <SizePicker sizes={product.inventory} />
            {!product.in_stock && <p className="muted">This item is currently sold out in every size.</p>}

            <button className="btn btn-primary ask-btn" onClick={() => ask('Tell me about this item, and what would go well with it?')}>
              Ask the assistant about this item
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
