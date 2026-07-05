import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authApi } from '../api/endpoints'
import { setSessionExpiredHandler, tokenStore } from '../api/client'
import type { Role, UserSummary } from '../api/types'

interface AuthState {
  user: UserSummary | null
  /** true while the initial silent refresh is in flight */
  loading: boolean
  login: (email: string, password: string) => Promise<UserSummary>
  register: (body: Parameters<typeof authApi.register>[0]) => Promise<UserSummary>
  logout: () => void
  hasRole: (...roles: Role[]) => boolean
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(null)
  const [loading, setLoading] = useState(true)

  // Resume the session on hard reload: the access token lives in memory only,
  // so trade the persisted refresh token for a fresh pair.
  useEffect(() => {
    const refreshToken = tokenStore.getRefresh()
    if (!refreshToken) {
      setLoading(false)
      return
    }
    authApi
      .refresh(refreshToken)
      .then((tokens) => {
        tokenStore.set(tokens)
        setUser(tokens.user)
      })
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setSessionExpiredHandler(() => setUser(null))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authApi.login(email, password)
    tokenStore.set(tokens)
    setUser(tokens.user)
    return tokens.user
  }, [])

  const register = useCallback(
    async (body: Parameters<typeof authApi.register>[0]) => {
      const tokens = await authApi.register(body)
      tokenStore.set(tokens)
      setUser(tokens.user)
      return tokens.user
    },
    [],
  )

  const logout = useCallback(() => {
    const refreshToken = tokenStore.getRefresh()
    if (refreshToken) {
      authApi.logout(refreshToken).catch(() => {})
    }
    tokenStore.clear()
    setUser(null)
  }, [])

  const hasRole = useCallback(
    (...roles: Role[]) => (user ? roles.includes(user.role) : false),
    [user],
  )

  const value = useMemo(
    () => ({ user, loading, login, register, logout, hasRole }),
    [user, loading, login, register, logout, hasRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
