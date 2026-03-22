import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/components/theme-provider'
import { useAuthStore } from '@/stores/auth'
import { AuthLayout } from '@/layouts/auth-layout'
import { AppLayout } from '@/layouts/app-layout'
import { AuthGuard } from '@/components/auth/auth-guard'
import { LoginPage } from '@/components/auth/login-page'
import { RegisterPage } from '@/components/auth/register-page'
import { ChatLayout } from '@/components/chat/chat-layout'
import { FriendsPage } from '@/components/friends/friends-page'
import { ProfilePage } from '@/components/profile/profile-page'
import { SettingsPage } from '@/components/settings/settings-page'

export default function App() {
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    const unsubscribe = initialize()
    return unsubscribe
  }, [])

  return (
    <BrowserRouter>
      <ThemeProvider>
        <TooltipProvider>
          <Routes>
            {/* Public routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Protected routes */}
            <Route
              element={
                <AuthGuard>
                  <AppLayout />
                </AuthGuard>
              }
            >
              <Route path="/" element={<ChatLayout />} />
              <Route path="/friends" element={<FriendsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
          <Toaster position="top-center" />
        </TooltipProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
