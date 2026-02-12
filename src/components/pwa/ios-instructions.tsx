'use client'

import { Share, PlusSquare } from 'lucide-react'

/**
 * Instructions d'installation pour iOS
 * Safari ne supporte pas beforeinstallprompt, donc on affiche des instructions manuelles
 */
export function IOSInstructions() {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="mb-3 font-semibold text-slate-900">
        Comment installer sur iPhone/iPad
      </h3>
      <ol className="space-y-3 text-sm text-slate-600">
        <li className="flex items-start gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
            1
          </span>
          <span className="pt-0.5">
            Appuyez sur le bouton{' '}
            <Share className="inline h-4 w-4 text-blue-500" />{' '}
            <strong>Partager</strong> en bas de Safari
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
            2
          </span>
          <span className="pt-0.5">
            Faites défiler et appuyez sur{' '}
            <PlusSquare className="inline h-4 w-4 text-slate-600" />{' '}
            <strong>Sur l&apos;écran d&apos;accueil</strong>
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
            3
          </span>
          <span className="pt-0.5">
            Appuyez sur <strong>Ajouter</strong> en haut à droite
          </span>
        </li>
      </ol>
    </div>
  )
}
