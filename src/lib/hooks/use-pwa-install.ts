'use client'

import { useState, useEffect, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface UsePWAInstallReturn {
  isInstallable: boolean
  isInstalled: boolean
  isIOS: boolean
  isAndroid: boolean
  isMobile: boolean
  promptInstall: () => Promise<boolean>
}

/**
 * Hook pour gérer l'installation PWA
 * - Détecte si l'app peut être installée
 * - Détecte si l'app est déjà installée (mode standalone)
 * - Détecte la plateforme (iOS, Android)
 * - Expose une méthode pour déclencher l'installation
 */
export function usePWAInstall(): UsePWAInstallReturn {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Détection de la plateforme
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
    const isAndroidDevice = /android/.test(userAgent)
    const isMobileDevice = isIOSDevice || isAndroidDevice || /mobile/.test(userAgent)

    setIsIOS(isIOSDevice)
    setIsAndroid(isAndroidDevice)
    setIsMobile(isMobileDevice)

    // Détection si l'app est en mode standalone (installée)
    const checkInstalled = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://')

      setIsInstalled(isStandalone)
    }

    checkInstalled()

    // Écoute les changements de display-mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const handleChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches)
    }
    mediaQuery.addEventListener('change', handleChange)

    // Capture l'événement beforeinstallprompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Détecte quand l'app est installée
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  /**
   * Déclenche le prompt d'installation (Android uniquement)
   * Retourne true si l'utilisateur a accepté, false sinon
   */
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) {
      return false
    }

    try {
      await installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice

      if (outcome === 'accepted') {
        setInstallPrompt(null)
        return true
      }

      return false
    } catch (error) {
      console.error('Erreur installation PWA:', error)
      return false
    }
  }, [installPrompt])

  return {
    isInstallable: !!installPrompt,
    isInstalled,
    isIOS,
    isAndroid,
    isMobile,
    promptInstall,
  }
}
