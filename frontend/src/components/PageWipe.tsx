import { useLocation } from 'react-router-dom'

// Two locker doors that slide open each time the page changes. The doors rest in the open position, so if the
// animation never runs (or Calm mode is on) nothing is covered. See App.css.
export default function PageWipe() {
  const { pathname } = useLocation()
  return (
    <div key={pathname} className="wipe" aria-hidden="true">
      <div className="wipe-door wipe-left" />
      <div className="wipe-door wipe-right" />
    </div>
  )
}
