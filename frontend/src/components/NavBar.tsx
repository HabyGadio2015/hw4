import { NavLink, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import { useAuth } from '../auth'

const mainLinks = [
  { to: '/', label: 'Home' },
  { to: '/products', label: 'Products' },
  { to: '/about', label: 'About Us' },
]

const linkClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'nav-link active' : 'nav-link')

export default function NavBar() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Logo />
        <nav className="nav-main" aria-label="Main">
          {mainLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <nav className="nav-account" aria-label="Account">
          {loading ? null : user ? (
            <>
              <span className="jersey-chip" title="Your player number">
                <span className="jersey-no">#{user.id}</span>
                {user.first_name || user.name}
              </span>
              <button className="btn btn-light" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Log in
              </NavLink>
              <NavLink to="/create-account" className="btn btn-light">
                Create Account
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
