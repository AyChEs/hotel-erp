import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import type { Role } from '../api/types'

/**
 * Route guard. Unauthenticated users go to /login (remembering where they
 * were); authenticated users without the required role go to their home.
 */
export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user, loading, hasRole } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-glaze-50">
        <span className="divider-arabesque w-40 font-display text-gold-500">◆</span>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (roles && !hasRole(...roles)) {
    return <Navigate to={homeFor(user.role)} replace />
  }

  return <Outlet />
}

export function homeFor(role: Role): string {
  return role === 'CLIENT' ? '/account' : '/admin'
}
