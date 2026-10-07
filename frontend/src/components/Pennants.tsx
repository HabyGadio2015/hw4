// A string of pennant flags that sway gently. Purely decorative.
export default function Pennants() {
  return (
    <ul className="pennants" aria-hidden="true">
      {Array.from({ length: 28 }, (_, i) => (
        <li key={i} style={{ ['--i' as string]: i }} />
      ))}
    </ul>
  )
}
