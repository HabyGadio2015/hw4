import { useTheme } from '../theme'

export default function ThemeToggles() {
  const { gameDay, calm, toggleGameDay, toggleCalm } = useTheme()
  return (
    <span className="announcement-toggles">
      <button className={gameDay ? 'toggle on' : 'toggle'} onClick={toggleGameDay} aria-pressed={gameDay}>
        🏈 Game Day
      </button>
      <button className={calm ? 'toggle on' : 'toggle'} onClick={toggleCalm} aria-pressed={calm}>
        Calm mode
      </button>
    </span>
  )
}
