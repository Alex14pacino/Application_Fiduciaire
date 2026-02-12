'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface InstallRedirectProps {
  children: React.ReactNode
}

/**
 * Composant qui redirige vers /install si :
 * - L'utilisateur est sur mobile
 * - L'app n'est pas installée (pas en mode standalone)
 * - L'utilisateur n'a pas déjà vu/fermé la page install (cookie)
 */
export function InstallRedirect({ children }: InstallRedirectProps) {
  const router = useRouter()
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    // Vérifie si on doit rediriger vers /install
    const checkInstallRedirect = () => {
      // Détection mobile
      const userAgent = window.navigator.userAgent.toLowerCase()
      const isMobile = /iphone|ipad|ipod|android|mobile/.test(userAgent)

      if (!isMobile) {
        setShouldRender(true)
        return
      }

      // Détection mode standalone (app installée)
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true

      if (isStandalone) {
        setShouldRender(true)
        return
      }

      // Vérifie si l'utilisateur a déjà vu la page install
      const hasSeenInstall = localStorage.getItem('fidudocs-install-seen')

      if (hasSeenInstall) {
        setShouldRender(true)
        return
      }

      // Redirige vers /install
      router.replace('/install')
    }

    checkInstallRedirect()
  }, [router])

  // Affiche un écran de chargement pendant la vérification
  if (!shouldRender) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
      </div>
    )
  }

  return <>{children}</>
}

/**
 * Marque que l'utilisateur a vu la page d'installation
 * À appeler quand l'utilisateur clique sur "Continuer sans installer"
 */
export function markInstallSeen() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('fidudocs-install-seen', 'true')
  }
}
