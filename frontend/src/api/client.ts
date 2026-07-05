import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ProblemDetail, TokenResponse } from './types'

/**
 * Access token lives in memory only; the refresh token is persisted in
 * localStorage (trade-off documented in the README: short access TTL +
 * rotation with reuse detection on the server).
 */
const REFRESH_KEY = 'hotel-erp.refreshToken'

let accessToken: string | null = null

export const tokenStore = {
  getAccess: () => accessToken,
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set(tokens: TokenResponse) {
    accessToken = tokens.accessToken
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken)
  },
  clear() {
    accessToken = null
    localStorage.removeItem(REFRESH_KEY)
  },
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
})

api.interceptors.request.use((config) => {
  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

/** Called by the auth context so a 401-with-dead-refresh can log the user out. */
let onSessionExpired: (() => void) | null = null
export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler
}

// Single-flight refresh: concurrent 401s wait on the same promise instead of
// each firing its own /refresh (which would trip the reuse detection).
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStore.getRefresh()
  if (!refreshToken) return null
  try {
    // Plain axios: must not go through the 401 interceptor recursively
    const { data } = await axios.post<TokenResponse>(
      `${api.defaults.baseURL}/api/auth/refresh`,
      { refreshToken },
    )
    tokenStore.set(data)
    return data.accessToken
  } catch {
    tokenStore.clear()
    return null
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ProblemDetail>) => {
    const original = error.config as InternalAxiosRequestConfig & { _retried?: boolean }
    const isAuthCall = original?.url?.includes('/api/auth/')

    if (error.response?.status === 401 && !original._retried && !isAuthCall) {
      original._retried = true
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null
      })
      const newToken = await refreshPromise
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      }
      onSessionExpired?.()
    }
    return Promise.reject(error)
  },
)

/** Human-readable message out of an RFC 7807 error, with field details if present. */
export function problemMessage(error: unknown): string {
  if (axios.isAxiosError<ProblemDetail>(error) && error.response?.data) {
    const problem = error.response.data
    if (problem.errors) {
      return Object.entries(problem.errors)
        .map(([field, message]) => `${field}: ${message}`)
        .join(' · ')
    }
    return problem.detail ?? problem.title ?? error.message
  }
  return error instanceof Error ? error.message : 'Unexpected error'
}
