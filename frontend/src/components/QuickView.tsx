import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { fetchProduct, formatPrice } from '../api'
import { useChatBridge } from '../chatbridge'
import ColorDots from './ColorDots'
import type { ProductDetail } from '../types'

const LOW_STOCK = 5

// A pop-up with a product's details, so shoppers can look without leaving the list. Esc, the backdrop, or X closes it.
export default function QuickView({ productId, onClose }: { productId: string; onClose: () => void }) {
  const { ask } = useChatBridge()
  const [result, setResult] = useState<{ id: string; product?: ProductDetail; failed?: boolean } | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    fetchProduct(productId)
      .then((product) => setResult({ id: productId, product }))
      .catch(() => setResult({ id: productId, failed: true }))
  }, [productId])

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const product = result?.id === productId ? (result.product ?? null) : null
  const failed = result?.id === productId && result.failed

  return createPortal(
    <div className="qv-backdrop" onClick={onClose}>
      <div className="qv" role="dialog" aria-modal="true" aria-label="Quick look" onClick={(e) => e.stopPropagation()}>
        <button ref={closeRef} className="qv-close" onClick={onClose} aria-label="Close quick look">
          ×
        </button>
        {failed && <p className="muted">Sorry, we couldn’t load that product.</p>}
        {!failed && !product && <p className="muted">Loading…</p>}
        {product && (
          <div className="qv-body">
            <img src={product.image_url} alt={product.name} className="qv-image" />
            <div>
              <p className="eyebrow">{product.garment_type}</p>
              <h2>{product.name}</h2>
              <p className="qv-price">{formatPrice(product.price)}</p>
              <p>{product.description}</p>
              <ColorDots colors={product.colors} />
              <div className="size-chips">
                {product.inventory.map((s) => (
                  <span
                    key={s.size}
                    className={`size-chip ${s.quantity === 0 ? 'out' : s.quantity <= LOW_STOCK ? 'low' : ''}`}
                    title={s.quantity === 0 ? `${s.size}: out of stock` : `${s.size}: ${s.quantity} in stock`}
                  >
                    {s.size}
                  </span>
                ))}
              </div>
              <div className="qv-actions">
                <Link to={`/products/${product.product_id}`} className="btn btn-primary" onClick={onClose}>
                  See full details
                </Link>
                <button
                  className="btn btn-outline-dark"
                  onClick={() => {
                    ask(`Tell me about the ${product.name}. What would go well with it?`)
                    onClose()
                  }}
                >
                  Ask about this
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
