import { useTheme } from '../theme'

const COLORS = ['#00356b', '#63aaff', '#c9a24b', '#ffffff', '#a51c30']

// A burst of confetti. The pieces are laid out by a fixed formula (no randomness), so every burst looks lively
// but the component stays predictable. It does nothing in Calm mode.
export default function Confetti() {
  const { burst, calm } = useTheme()
  if (burst === 0 || calm) return null
  return (
    <div className="confetti" key={burst} aria-hidden="true">
      {Array.from({ length: 70 }, (_, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            ['--x' as string]: `${(i * 37) % 100}vw`,
            ['--drift' as string]: `${((i * 17) % 41) - 20}vw`,
            ['--delay' as string]: `${(i % 10) * 0.07}s`,
            ['--spin' as string]: `${((i * 53) % 360) + 360}deg`,
            ['--size' as string]: `${6 + (i % 4) * 3}px`,
            background: COLORS[i % COLORS.length],
          }}
        />
      ))}
    </div>
  )
}
