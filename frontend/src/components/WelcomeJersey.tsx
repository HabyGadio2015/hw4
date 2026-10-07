import { useEffect } from 'react'
import { useAuth } from '../auth'

// Shown once, right after someone creates an account: a jersey with their name and player number (their account number).
export default function WelcomeJersey() {
  const { user, justJoined, dismissWelcome } = useAuth()

  useEffect(() => {
    if (!justJoined) return
    const timer = window.setTimeout(dismissWelcome, 6000)
    return () => window.clearTimeout(timer)
  }, [justJoined, dismissWelcome])

  if (!user || !justJoined) return null
  const first = user.first_name || user.name
  const jerseyName = first.toUpperCase().slice(0, 14)

  return (
    <div className="welcome" onClick={dismissWelcome} role="dialog" aria-label="Welcome to the team">
      <div className="welcome-card">
        <svg className="welcome-jersey" viewBox="0 0 100 100" aria-hidden="true">
          <path d="M30 8 L8 24 L19 42 L30 35 V94 H70 V35 L81 42 L92 24 L70 8 C66 20 34 20 30 8 Z" fill="#00356b" stroke="#fff" strokeWidth="2" />
          <path d="M30 56 H70 M30 62 H70" stroke="#c9a24b" strokeWidth="3" />
          <text x="50" y="34" textAnchor="middle" fontSize={jerseyName.length > 9 ? 6 : 8} fontWeight="800" fill="#fff" letterSpacing="1">
            {jerseyName}
          </text>
          <text x="50" y="84" textAnchor="middle" fontSize={String(user.id).length > 2 ? 24 : 32} fontWeight="900" fill="#fff" fontFamily="Rockwell, Georgia, serif">
            {user.id}
          </text>
        </svg>
        <h2>Welcome to the team, {first}!</h2>
        <p>You&apos;re player #{user.id}. Tap anywhere to start shopping.</p>
      </div>
    </div>
  )
}
