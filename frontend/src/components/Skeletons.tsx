function Silhouette({ hoodie }: { hoodie: boolean }) {
  return (
    <svg viewBox="0 0 80 72" className="sk-garment" aria-hidden="true">
      <path
        d={
          hoodie
            ? 'M22 14 L6 26 L14 38 L24 33 V66 H56 V33 L66 38 L74 26 L58 14 C56 5 24 5 22 14 Z'
            : 'M22 8 L6 20 L14 32 L24 27 V62 H56 V27 L66 32 L74 20 L58 8 C54 14 26 14 22 8 Z'
        }
      />
    </svg>
  )
}

// A grey hoodie or tee shape that shimmers where a product card will appear.
export function SkeletonCard({ hoodie }: { hoodie: boolean }) {
  return (
    <div className="sk-card" aria-hidden="true">
      <div className="sk-photo">
        <Silhouette hoodie={hoodie} />
      </div>
      <div className="sk-line wide" />
      <div className="sk-line" />
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="detail" role="status" aria-label="Loading product">
      <div className="sk-photo sk-big">
        <Silhouette hoodie />
      </div>
      <div className="sk-lines">
        <div className="sk-line short" />
        <div className="sk-line wide tall" />
        <div className="sk-line short" />
        <div className="sk-line wide" />
        <div className="sk-line wide" />
        <div className="sk-line" />
      </div>
    </div>
  )
}
