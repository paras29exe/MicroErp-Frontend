import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/auth.store'
import { hasPermission } from '@/lib/permissions'

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isBootstrapping } = useAuthStore()

  if (isBootstrapping) {
    return <div className="p-4 text-sm text-slate-600">Checking session...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export function PermissionRoute({ permission, children }) {
  const { user } = useAuthStore()

  if (!user || !hasPermission(user.role, permission)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
