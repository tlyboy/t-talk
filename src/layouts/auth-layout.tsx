import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { Toolbar } from '@/components/toolbar'

export function AuthLayout() {
  const session = useAuthStore((s) => s.session)
  const loading = useAuthStore((s) => s.loading)

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    )
  }

  if (session) {
    return <Navigate to="/" replace />
  }

  return (
    <>
      <Toolbar />
      <Outlet />
    </>
  )
}
