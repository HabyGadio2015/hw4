import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import * as api from './api'
import type { SignupInput, User } from './types'

interface AuthState {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (input: SignupInput) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Restore the session from the HttpOnly cookie on page load.
  useEffect(() => {
    api
      .fetchMe()
      .then(setUser)
      .finally(() => setLoading(false))
  }, [])

  const value: AuthState = {
    user,
    loading,
    login: async (email, password) => setUser(await api.login(email, password)),
    signup: async (input) => setUser(await api.signup(input)),
    logout: async () => {
      await api.logout()
      setUser(null)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
