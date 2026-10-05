import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import type { SignupInput } from '../types'

const MIN_PASSWORD_LENGTH = 8

const EMPTY: SignupInput = { first_name: '', last_name: '', email: '', password: '', confirm_password: '' }

export default function CreateAccount() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<SignupInput>(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const update = (field: keyof SignupInput) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const mismatch = form.confirm_password.length > 0 && form.password !== form.confirm_password

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (form.password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      await signup(form)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create your account.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="section page">
      <div className="form-card">
        <h1 className="page-title">Create Account</h1>
        <p className="muted">Join the Campus Customs family.</p>
        <form className="form" onSubmit={handleSubmit}>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="form-row">
            <label>
              First Name
              <input
                type="text"
                name="first_name"
                autoComplete="given-name"
                value={form.first_name}
                onChange={update('first_name')}
                required
              />
            </label>
            <label>
              Last Name
              <input
                type="text"
                name="last_name"
                autoComplete="family-name"
                value={form.last_name}
                onChange={update('last_name')}
                required
              />
            </label>
          </div>
          <label>
            Email
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={form.email}
              onChange={update('email')}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              value={form.password}
              onChange={update('password')}
              required
            />
            <span className="field-hint">At least {MIN_PASSWORD_LENGTH} characters.</span>
          </label>
          <label>
            Confirm Password
            <input
              type="password"
              name="confirm_password"
              autoComplete="new-password"
              value={form.confirm_password}
              onChange={update('confirm_password')}
              aria-invalid={mismatch}
              required
            />
            {mismatch && <span className="field-error">Passwords do not match.</span>}
          </label>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
        <p className="muted">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </section>
  )
}
