import { Link } from 'react-router-dom'

export default function Login() {
  return (
    <section className="section page">
      <div className="form-card">
        <h1 className="page-title">Log in</h1>
        <p className="muted">Welcome back, Bulldog.</p>
        <form className="form" onSubmit={(e) => e.preventDefault()}>
          <label>
            Email
            <input type="email" name="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input type="password" name="password" autoComplete="current-password" required />
          </label>
          <button type="submit" className="btn btn-primary">
            Log in
          </button>
        </form>
        <p className="muted">
          New here? <Link to="/create-account">Create an account</Link>
        </p>
      </div>
    </section>
  )
}
