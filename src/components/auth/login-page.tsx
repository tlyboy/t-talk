import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Turnstile } from '@marsidev/react-turnstile'
import { toast } from 'sonner'
import { Github } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/components/theme-provider'
import { verifyTurnstile } from '@/lib/turnstile'

export function LoginPage() {
  const { t, i18n } = useTranslation()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const signIn = useAuthStore((s) => s.signIn)
  const signInWithGithub = useAuthStore((s) => s.signInWithGithub)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!turnstileToken) {
      toast.error(t('auth.verifyHuman'))
      return
    }

    setLoading(true)
    const verified = await verifyTurnstile(turnstileToken)
    if (!verified) {
      toast.error(t('auth.verifyHuman'))
      setLoading(false)
      return
    }

    const { error } = await signIn(email, password)
    setLoading(false)

    if (error) {
      toast.error(error)
    } else {
      toast.success(t('auth.loginSuccess'))
      navigate('/')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('auth.loginTitle')}</CardTitle>
          <CardDescription>{t('auth.loginDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Turnstile
              key={`${theme}-${i18n.language}`}
              siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
              onSuccess={setTurnstileToken}
              options={{
                language: i18n.language === 'zh-CN' ? 'zh-CN' : i18n.language,
                theme: theme === 'system' ? 'auto' : theme,
              }}
              className="mx-auto"
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('common.loading') : t('auth.login')}
            </Button>
          </form>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card text-muted-foreground px-2">or</span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => signInWithGithub()}
          >
            <Github className="mr-2 h-4 w-4" />
            {t('auth.githubLogin')}
          </Button>
          <p className="text-muted-foreground mt-4 text-center text-sm">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-primary underline">
              {t('auth.register')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
