const STRIPES = 20

// A striped shop awning with a scalloped edge. It rolls down when the page loads (see App.css).
export default function Awning() {
  const w = 100 / STRIPES
  return (
    <svg className="awning" viewBox="0 0 100 14" preserveAspectRatio="none" aria-hidden="true">
      {Array.from({ length: STRIPES }, (_, i) => (
        <path
          key={i}
          d={`M${i * w} 0 H${(i + 1) * w} V9 A${w / 2} 5 0 0 1 ${i * w} 9 Z`}
          fill={i % 2 === 0 ? 'var(--yale-blue)' : '#fbf7ee'}
        />
      ))}
    </svg>
  )
}
