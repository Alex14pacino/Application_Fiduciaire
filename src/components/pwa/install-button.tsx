'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePWAInstall } from '@/lib/hooks/use-pwa-install'

interface InstallButtonProps {
  className?: string
}

/**
 * Bouton d'installation PWA
 * Visible uniquement sur Android quand l'installation est possible
 */
export function InstallButton({ className }: InstallButtonProps) {
  const { isInstallable, promptInstall } = usePWAInstall()

  if (!isInstallable) {
    return null
  }

  const handleInstall = async () => {
    const accepted = await promptInstall()
    if (accepted) {
      // L'app est en cours d'installation
      console.log('Installation acceptée')
    }
  }

  return (
    <Button
      onClick={handleInstall}
      size="lg"
      className={className}
    >
      <Download className="mr-2 h-5 w-5" />
      Installer l&apos;application
    </Button>
  )
}
