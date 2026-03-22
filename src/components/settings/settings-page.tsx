import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Trash2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { StorageSettings } from '@/components/profile/storage-settings'
import { clearStorageCache } from '@/lib/storage'

export function SettingsPage() {
  const { t } = useTranslation()
  const [clearing, setClearing] = useState(false)
  const [checking, setChecking] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<string | null>(null)

  const handleClearCache = async () => {
    setClearing(true)
    try {
      clearStorageCache()
      localStorage.removeItem('language')
      toast.success(t('settings.cacheCleared'))
    } catch {
      toast.error(t('common.error'))
    }
    setClearing(false)
  }

  const handleCheckUpdate = async () => {
    setChecking(true)
    setUpdateStatus(null)
    try {
      const { check } = await import('@tauri-apps/plugin-updater')
      const update = await check()
      if (update) {
        setUpdateStatus(
          t('settings.updateAvailable', { version: update.version }),
        )
        await update.downloadAndInstall()
        const { relaunch } = await import('@tauri-apps/plugin-process')
        await relaunch()
      } else {
        setUpdateStatus(t('settings.upToDate'))
      }
    } catch {
      setUpdateStatus(t('settings.updateError'))
    }
    setChecking(false)
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>

        {/* Storage */}
        <StorageSettings />

        <Separator />

        {/* Clear cache */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium">{t('settings.cache')}</h2>
          <p className="text-muted-foreground text-xs">
            {t('settings.cacheDescription')}
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleClearCache}
            disabled={clearing}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {clearing ? t('common.loading') : t('settings.clearCache')}
          </Button>
        </div>

        <Separator />

        {/* Check update */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium">{t('settings.update')}</h2>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleCheckUpdate}
            disabled={checking}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${checking ? 'animate-spin' : ''}`}
            />
            {checking ? t('settings.checking') : t('settings.checkUpdate')}
          </Button>
          {updateStatus && (
            <p className="text-muted-foreground text-center text-xs">
              {updateStatus}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
