'use client'

import { useState, useEffect, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Stockage global pour capturer l'événement avant le montage React
let deferredPrompt: BeforeInstallPromptEvent | null = null

// Capture l'événement dès que possible (avant React)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
  })
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
    // Récupère le prompt capturé globalement
    if (deferredPrompt) {
      setInstallPrompt(deferredPrompt)
    }

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
      deferredPrompt = e as BeforeInstallPromptEvent
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Détecte quand l'app est installée
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
      deferredPrompt = null
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
    const prompt = installPrompt || deferredPrompt

    if (!prompt) {
      return false
    }

    try {
      await prompt.prompt()
      const { outcome } = await prompt.userChoice

      if (outcome === 'accepted') {
        setInstallPrompt(null)
        deferredPrompt = null
        return true
      }

      return false
    } catch (error) {
      console.error('Erreur installation PWA:', error)
      return false
    }
  }, [installPrompt])

  return {
    isInstallable: !!(installPrompt || deferredPrompt),
    isInstalled,
    isIOS,
    isAndroid,
    isMobile,
    promptInstall,
  }
}
