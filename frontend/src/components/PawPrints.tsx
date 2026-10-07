function Paw({ i }: { i: number }) {
  return (
    <svg className="paw" style={{ ['--i' as string]: i }} viewBox="0 0 24 24" aria-hidden="true">
      <ellipse cx="12" cy="16" rx="6" ry="5" />
      <ellipse cx="5.5" cy="9.5" rx="2.4" ry="3" />
      <ellipse cx="10" cy="5.5" rx="2.4" ry="3" />
      <ellipse cx="14.5" cy="5.5" rx="2.4" ry="3" />
      <ellipse cx="19" cy="9.5" rx="2.4" ry="3" />
    </svg>
  )
}

// The "typing" indicator: paw prints that light up one after another, like a dog padding across the chat.
export default function PawPrints() {
  return (
    <span className="paws-row">
      {[0, 1, 2, 3].map((i) => (
        <Paw key={i} i={i} />
      ))}
    </span>
  )
}
