'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileText, Shield, Smartphone, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InstallButton } from '@/components/pwa/install-button'
import { IOSInstructions } from '@/components/pwa/ios-instructions'
import { markInstallSeen } from '@/components/pwa/install-redirect'
import { usePWAInstall } from '@/lib/hooks/use-pwa-install'

export default function InstallPage() {
  const router = useRouter()
  const { isInstalled, isIOS, isAndroid, isMobile, isInstallable } = usePWAInstall()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirige vers login si déjà installé
  useEffect(() => {
    if (mounted && isInstalled) {
      router.replace('/login')
    }
  }, [mounted, isInstalled, router])

  // Affiche un écran de chargement pendant l'hydratation
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo / Icône */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
          <FileText className="h-10 w-10" />
        </div>

        {/* Titre */}
        <h1 className="mb-2 text-center text-3xl font-bold text-slate-900">
          FiduDocs
        </h1>
        <p className="mb-8 text-center text-slate-600">
          Gestion documentaire simplifiée
        </p>

        {/* Features */}
        <div className="mb-8 w-full max-w-sm space-y-4">
          <div className="flex items-start gap-3 rounded-lg bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <Smartphone className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Capture facile</h3>
              <p className="text-sm text-slate-600">
                Prenez vos justificatifs en photo directement depuis l&apos;app
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Sécurisé</h3>
              <p className="text-sm text-slate-600">
                Vos documents sont transmis de façon sécurisée à votre fiduciaire
              </p>
            </div>
          </div>
        </div>

        {/* Actions d'installation */}
        <div className="w-full max-w-sm space-y-4">
          {/* Android avec prompt disponible */}
          {isAndroid && isInstallable && (
            <InstallButton className="w-full h-14 text-lg" />
          )}

          {/* Android sans prompt (navigateur non supporté ou déjà refusé) */}
          {isAndroid && !isInstallable && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-medium">Installation</p>
              <p>
                Utilisez le menu de votre navigateur (⋮) puis &quot;Installer l&apos;application&quot; ou &quot;Ajouter à l&apos;écran d&apos;accueil&quot;.
              </p>
            </div>
          )}

          {/* iOS - Instructions manuelles */}
          {isIOS && <IOSInstructions />}

          {/* Desktop - Message informatif */}
          {!isMobile && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-medium text-slate-900">Application mobile</p>
              <p>
                FiduDocs est optimisé pour mobile. Ouvrez cette page sur votre smartphone pour installer l&apos;application.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer - Lien vers login */}
      <div className="border-t border-slate-200 bg-white px-6 py-6">
        <div className="mx-auto max-w-sm">
          <Link href="/login" onClick={() => markInstallSeen()}>
            <Button variant="outline" className="w-full">
              Continuer sans installer
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <p className="mt-3 text-center text-xs text-slate-500">
            Vous pourrez installer l&apos;application plus tard
          </p>
        </div>
      </div>
    </div>
  )
}
