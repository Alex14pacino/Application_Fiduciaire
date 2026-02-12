'use client'

import { useEffect, useState } from 'react'
import { Download, X, Share, Plus, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePWAInstall } from '@/lib/hooks/use-pwa-install'

/**
 * Popup d'installation PWA qui s'affiche automatiquement
 * sur mobile si l'app n'est pas installée
 */
export function InstallPrompt() {
  const { isInstalled, isInstallable, isMobile, isIOS, isAndroid, promptInstall } = usePWAInstall()
  const [showPrompt, setShowPrompt] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    // Vérifie si l'utilisateur a déjà fermé le prompt récemment
    const dismissedAt = localStorage.getItem('fidudocs-install-dismissed')
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt)
      const now = new Date()
      // Ne pas réafficher pendant 7 jours après fermeture
      const daysSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 7) {
        setDismissed(true)
        return
      }
    }

    // Affiche le prompt après un court délai si sur mobile et pas installé
    const timer = setTimeout(() => {
      if (isMobile && !isInstalled && !dismissed) {
        setShowPrompt(true)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [isMobile, isInstalled, dismissed])

  const handleInstall = async () => {
    if (isInstallable) {
      setInstalling(true)
      const accepted = await promptInstall()
      setInstalling(false)

      if (accepted) {
        setShowPrompt(false)
      }
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)
    localStorage.setItem('fidudocs-install-dismissed', new Date().toISOString())
  }

  if (!showPrompt) {
    return null
  }

  // Contenu pour iOS (instructions Safari)
  const renderIOSInstructions = () => (
    <div className="text-left">
      <p className="mb-3 text-sm font-medium text-slate-900">
        Pour installer sur iPhone/iPad :
      </p>
      <ol className="space-y-2 text-sm text-slate-600">
        <li className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">1</span>
          Appuyez sur <Share className="inline h-4 w-4 text-blue-500" /> en bas
        </li>
        <li className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">2</span>
          <Plus className="inline h-4 w-4" /> <strong>Sur l&apos;écran d&apos;accueil</strong>
        </li>
        <li className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">3</span>
          Appuyez sur <strong>Ajouter</strong>
        </li>
      </ol>
    </div>
  )

  // Contenu pour Android sans prompt natif (Firefox, Samsung Internet)
  const renderAndroidManualInstructions = () => (
    <div className="text-left">
      <p className="mb-3 text-sm font-medium text-slate-900">
        Pour installer l&apos;application :
      </p>
      <ol className="space-y-2 text-sm text-slate-600">
        <li className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">1</span>
          Appuyez sur <MoreVertical className="inline h-4 w-4" /> en haut à droite
        </li>
        <li className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">2</span>
          <strong>Ajouter à l&apos;écran d&apos;accueil</strong>
        </li>
      </ol>
    </div>
  )

  // Contenu pour Android avec prompt natif (Chrome, Brave, Edge)
  const renderInstallButton = () => (
    <div className="space-y-3">
      <Button
        onClick={handleInstall}
        disabled={installing}
        className="w-full h-12"
      >
        {installing ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <>
            <Download className="mr-2 h-5 w-5" />
            Installer
          </>
        )}
      </Button>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md animate-in slide-in-from-bottom duration-300 rounded-2xl bg-white p-6 shadow-xl">
        {/* Bouton fermer */}
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Contenu */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Download className="h-7 w-7" />
          </div>

          <h3 className="mb-2 text-lg font-semibold text-slate-900">
            Installer FiduDocs
          </h3>

          <p className="mb-4 text-sm text-slate-600">
            Ajoutez l&apos;application à votre écran d&apos;accueil pour un accès rapide.
          </p>

          {/* Contenu selon la plateforme */}
          <div className="mb-4">
            {isIOS && renderIOSInstructions()}
            {isAndroid && isInstallable && renderInstallButton()}
            {isAndroid && !isInstallable && renderAndroidManualInstructions()}
          </div>

          <Button
            onClick={handleDismiss}
            variant="ghost"
            className="w-full text-slate-500"
          >
            Plus tard
          </Button>
        </div>
      </div>
    </div>
  )
}
