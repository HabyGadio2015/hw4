import { Link } from 'react-router-dom'

export default function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Campus Customs home">
      <img src="/logo.svg" alt="" className="logo-mark" />
      <span className="logo-text">
        <span className="logo-title">Yale Bulldog Blue</span>
        <span className="logo-sub">by Campus Customs</span>
      </span>
    </Link>
  )
}
