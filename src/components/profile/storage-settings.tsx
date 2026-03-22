import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getStorageConfig, saveStorageConfig } from '@/lib/storage'

export function StorageSettings() {
  const { t } = useTranslation()
  const existing = getStorageConfig()
  const [config, setConfig] = useState({
    endpoint: existing?.endpoint ?? '',
    region: existing?.region ?? 'auto',
    bucket: existing?.bucket ?? '',
    access_key_id: existing?.access_key_id ?? '',
    secret_access_key: existing?.secret_access_key ?? '',
    public_url: existing?.public_url ?? '',
    path_prefix: existing?.path_prefix ?? 'upload',
  })

  const handleSave = () => {
    if (
      !config.endpoint ||
      !config.bucket ||
      !config.access_key_id ||
      !config.secret_access_key ||
      !config.public_url
    ) {
      toast.error(t('storage.fillRequired'))
      return
    }
    saveStorageConfig(config)
    toast.success(t('profile.saved'))
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium">{t('storage.title')}</h2>
      <p className="text-muted-foreground text-xs">
        {t('storage.description')}
      </p>
      <div className="grid gap-3">
        <div className="grid gap-1.5">
          <Label>{t('storage.endpoint')}</Label>
          <Input
            placeholder="https://account-id.r2.cloudflarestorage.com"
            value={config.endpoint}
            onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label>{t('storage.bucket')}</Label>
            <Input
              placeholder="my-bucket"
              value={config.bucket}
              onChange={(e) => setConfig({ ...config, bucket: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>{t('storage.region')}</Label>
            <Input
              placeholder="auto"
              value={config.region}
              onChange={(e) => setConfig({ ...config, region: e.target.value })}
            />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label>Access Key ID</Label>
          <Input
            value={config.access_key_id}
            onChange={(e) =>
              setConfig({ ...config, access_key_id: e.target.value })
            }
          />
        </div>
        <div className="grid gap-1.5">
          <Label>Secret Access Key</Label>
          <Input
            type="password"
            value={config.secret_access_key}
            onChange={(e) =>
              setConfig({ ...config, secret_access_key: e.target.value })
            }
          />
        </div>
        <div className="grid gap-1.5">
          <Label>{t('storage.publicUrl')}</Label>
          <Input
            placeholder="https://cdn.example.com"
            value={config.public_url}
            onChange={(e) =>
              setConfig({ ...config, public_url: e.target.value })
            }
          />
        </div>
        <div className="grid gap-1.5">
          <Label>{t('storage.pathPrefix')}</Label>
          <Input
            placeholder="upload"
            value={config.path_prefix}
            onChange={(e) =>
              setConfig({ ...config, path_prefix: e.target.value })
            }
          />
        </div>
        <Button onClick={handleSave}>{t('common.save')}</Button>
      </div>
    </div>
  )
}
