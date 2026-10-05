import { Link } from 'react-router-dom'

export default function CreateAccount() {
  return (
    <section className="section page">
      <div className="form-card">
        <h1 className="page-title">Create Account</h1>
        <p className="muted">Join the Campus Customs family.</p>
        <form className="form" onSubmit={(e) => e.preventDefault()}>
          <div className="form-row">
            <label>
              First name
              <input type="text" name="first_name" autoComplete="given-name" required />
            </label>
            <label>
              Last name
              <input type="text" name="last_name" autoComplete="family-name" required />
            </label>
          </div>
          <label>
            Email
            <input type="email" name="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input type="password" name="password" autoComplete="new-password" minLength={8} required />
          </label>
          <button type="submit" className="btn btn-primary">
            Create Account
          </button>
        </form>
        <p className="muted">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </section>
  )
}
