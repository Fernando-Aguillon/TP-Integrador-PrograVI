import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth'

interface ProtectedRouteProps { allowedRoles?: string[] }

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, checking } = useAuth()
  if (checking) return <main className="grid min-h-[60vh] place-items-center text-sm text-slate-500" role="status">Comprobando sesión…</main>
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />
  return <Outlet />
}
