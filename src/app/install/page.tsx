'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileText, Download, Share, Plus, MoreVertical, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { markInstallSeen } from '@/components/pwa/install-redirect'
import { usePWAInstall } from '@/lib/hooks/use-pwa-install'

export default function InstallPage() {
  const router = useRouter()
  const { isInstalled, isIOS, isAndroid, isMobile, isInstallable, promptInstall } = usePWAInstall()
  const [mounted, setMounted] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirige vers login si déjà installé
  useEffect(() => {
    if (mounted && isInstalled) {
      router.replace('/login')
    }
  }, [mounted, isInstalled, router])

  const handleInstall = async () => {
    setInstalling(true)
    const accepted = await promptInstall()
    if (!accepted) {
      setInstalling(false)
    }
  }

  // Affiche un écran de chargement pendant l'hydratation
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-600 to-blue-800">
      {/* Header avec logo et titre */}
      <div className="px-6 pt-12 pb-6 text-center text-white">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-lg">
          <FileText className="h-10 w-10 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold">FiduDocs</h1>
        <p className="mt-1 text-blue-100">Vos documents, simplifiés</p>
      </div>

      {/* Zone principale - Carte blanche */}
      <div className="flex-1 rounded-t-3xl bg-white px-6 pt-8 pb-6">
        {/* Bouton d'installation principal - Android avec prompt */}
        {isAndroid && isInstallable && (
          <div className="mb-8">
            <Button
              onClick={handleInstall}
              disabled={installing}
              size="lg"
              className="w-full h-16 text-xl bg-green-600 hover:bg-green-700 shadow-lg"
            >
              {installing ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Download className="mr-3 h-6 w-6" />
                  Installer l&apos;application
                </>
              )}
            </Button>
            <p className="mt-3 text-center text-sm text-slate-500">
              Gratuit - Aucun téléchargement depuis le store
            </p>
          </div>
        )}

        {/* Instructions Android - sans prompt natif */}
        {isAndroid && !isInstallable && (
          <div className="mb-8">
            <h2 className="mb-4 text-center text-xl font-bold text-slate-900">
              Installer en 2 étapes
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-4 rounded-xl bg-slate-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">Ouvrez le menu</p>
                  <p className="text-sm text-slate-600">
                    Appuyez sur les 3 points <MoreVertical className="inline h-4 w-4" /> en haut à droite de Chrome
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-xl bg-slate-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">Installer l&apos;application</p>
                  <p className="text-sm text-slate-600">
                    Appuyez sur &quot;Installer l&apos;application&quot; ou &quot;Ajouter à l&apos;écran d&apos;accueil&quot;
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border-2 border-dashed border-green-300 bg-green-50 p-4 text-center">
              <Check className="mx-auto mb-2 h-8 w-8 text-green-600" />
              <p className="font-medium text-green-800">
                L&apos;icône FiduDocs apparaîtra sur votre écran d&apos;accueil
              </p>
            </div>
          </div>
        )}

        {/* Instructions iOS */}
        {isIOS && (
          <div className="mb-8">
            <h2 className="mb-4 text-center text-xl font-bold text-slate-900">
              Installer en 3 étapes
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-4 rounded-xl bg-slate-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">Appuyez sur Partager</p>
                  <p className="text-sm text-slate-600">
                    Touchez l&apos;icône <Share className="inline h-4 w-4 text-blue-500" /> en bas de Safari
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-xl bg-slate-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">Sur l&apos;écran d&apos;accueil</p>
                  <p className="text-sm text-slate-600">
                    Faites défiler et appuyez sur <Plus className="inline h-4 w-4" /> &quot;Sur l&apos;écran d&apos;accueil&quot;
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-xl bg-slate-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">Confirmez</p>
                  <p className="text-sm text-slate-600">
                    Appuyez sur &quot;Ajouter&quot; en haut à droite
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border-2 border-dashed border-green-300 bg-green-50 p-4 text-center">
              <Check className="mx-auto mb-2 h-8 w-8 text-green-600" />
              <p className="font-medium text-green-800">
                L&apos;icône FiduDocs apparaîtra sur votre écran d&apos;accueil
              </p>
            </div>
          </div>
        )}

        {/* Desktop */}
        {!isMobile && (
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-slate-900">Application mobile</h2>
            <p className="text-slate-600">
              FiduDocs est une application mobile. Scannez le QR code ou ouvrez cette page sur votre smartphone pour l&apos;installer.
            </p>
          </div>
        )}

        {/* Avantages */}
        <div className="mb-8 space-y-3">
          <h3 className="text-center text-sm font-semibold uppercase tracking-wide text-slate-400">
            Pourquoi installer ?
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 p-3 text-center">
              <p className="text-2xl">📸</p>
              <p className="text-xs text-slate-600">Capture rapide</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-center">
              <p className="text-2xl">🔒</p>
              <p className="text-xs text-slate-600">100% sécurisé</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-center">
              <p className="text-2xl">📱</p>
              <p className="text-xs text-slate-600">Accès direct</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-center">
              <p className="text-2xl">⚡</p>
              <p className="text-xs text-slate-600">Plus rapide</p>
            </div>
          </div>
        </div>

        {/* Lien pour continuer sans installer */}
        <div className="border-t border-slate-200 pt-6">
          <Link href="/login" onClick={() => markInstallSeen()}>
            <Button variant="ghost" className="w-full text-slate-500">
              Continuer sans installer
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
