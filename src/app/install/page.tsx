'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileText, Download, Share, Plus, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
            <FileText className="h-8 w-8" />
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Installer FiduDocs</CardTitle>
            <CardDescription>
              Installez l&apos;application pour un accès rapide
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Android - Bouton d'installation */}
            {isAndroid && (
              <div className="space-y-4">
                <Button
                  onClick={handleInstall}
                  disabled={installing || !isInstallable}
                  size="lg"
                  className="w-full h-12 text-base"
                >
                  {installing ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Download className="mr-2 h-5 w-5" />
                      Installer l&apos;application
                    </>
                  )}
                </Button>

                {!isInstallable && (
                  <p className="text-center text-sm text-slate-500">
                    Si le bouton ne fonctionne pas, utilisez le menu Chrome (⋮) → &quot;Installer l&apos;application&quot;
                  </p>
                )}
              </div>
            )}

            {/* iOS - Instructions étape par étape */}
            {isIOS && (
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-3 font-medium text-slate-900">
                    Comment installer sur iPhone/iPad :
                  </p>
                  <ol className="space-y-3 text-sm text-slate-600">
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                        1
                      </span>
                      <span>
                        Appuyez sur <Share className="inline h-4 w-4 text-blue-500" /> <strong>Partager</strong> en bas de Safari
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                        2
                      </span>
                      <span>
                        Appuyez sur <Plus className="inline h-4 w-4" /> <strong>Sur l&apos;écran d&apos;accueil</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                        3
                      </span>
                      <span>
                        Appuyez sur <strong>Ajouter</strong> en haut à droite
                      </span>
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {/* Desktop */}
            {!isMobile && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
                <p className="font-medium text-slate-900">Application mobile</p>
                <p className="mt-1 text-sm text-slate-600">
                  Ouvrez cette page sur votre smartphone pour installer l&apos;application.
                </p>
              </div>
            )}

            {/* Séparateur */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">ou</span>
              </div>
            </div>

            {/* Lien pour continuer sans installer */}
            <Link href="/login" onClick={() => markInstallSeen()}>
              <Button variant="outline" className="w-full">
                Continuer sans installer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-slate-500">
          Vous pourrez installer l&apos;application plus tard depuis les paramètres
        </p>
      </div>
    </div>
  )
}
