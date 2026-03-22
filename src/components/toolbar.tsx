import { ModeToggle } from '@/components/mode-toggle'
import { LocaleToggle } from '@/components/locale-toggle'

export function Toolbar() {
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-1">
      <LocaleToggle />
      <ModeToggle />
    </div>
  )
}
