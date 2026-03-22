import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MessageSquare, Users, Settings, LogOut } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/stores/auth'
import { useRealtime } from '@/hooks/use-realtime'
import { LocaleToggle } from '@/components/locale-toggle'
import { ModeToggle } from '@/components/mode-toggle'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: MessageSquare, label: 'chat.title' },
  { to: '/friends', icon: Users, label: 'friends.title' },
] as const

export function AppLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const signOut = useAuthStore((s) => s.signOut)

  useRealtime()

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <nav className="bg-muted/50 flex w-16 flex-col items-center border-r py-4">
        {/* Avatar → click to profile */}
        <Tooltip>
          <TooltipTrigger
            className="mb-6 cursor-pointer"
            onClick={() => navigate('/profile')}
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback>
                {(profile?.nickname || profile?.username || '?')
                  .charAt(0)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent side="right">{t('profile.title')}</TooltipContent>
        </Tooltip>

        <div className="flex flex-1 flex-col gap-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <Tooltip key={to}>
              <NavLink to={to} end={to === '/'}>
                {({ isActive }) => (
                  <TooltipTrigger
                    className={cn(
                      'inline-flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </TooltipTrigger>
                )}
              </NavLink>
              <TooltipContent side="right">{t(label)}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <Tooltip>
            <NavLink to="/settings">
              {({ isActive }) => (
                <TooltipTrigger
                  className={cn(
                    'inline-flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <Settings className="h-5 w-5" />
                </TooltipTrigger>
              )}
            </NavLink>
            <TooltipContent side="right">{t('settings.title')}</TooltipContent>
          </Tooltip>
          <LocaleToggle />
          <ModeToggle />
          <Tooltip>
            <TooltipTrigger
              className="hover:bg-accent hover:text-accent-foreground inline-flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium transition-colors"
              onClick={() => signOut()}
            >
              <LogOut className="h-5 w-5" />
            </TooltipTrigger>
            <TooltipContent side="right">{t('auth.logout')}</TooltipContent>
          </Tooltip>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
