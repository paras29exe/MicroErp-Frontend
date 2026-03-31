import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/auth.store'
import { hasPermission } from '@/lib/permissions'
import { Loader, LoaderCircle } from 'lucide-react'

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isBootstrapping } = useAuthStore()

  if (isBootstrapping) {
    return <div className="p-4 text-sm text-slate-600 flex h-screen items-center gap-3 justify-center">
      <LoaderCircle className="h-5 aspect-square animate-spin" />
      <p className="text-lg">Validating session...</p>
    </div>
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
