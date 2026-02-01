'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

// Lazy load du composant d'upload (inclut la caméra qui est lourde)
const DocumentUploadZone = dynamic(
  () => import('@/components/documents/document-upload-zone').then(mod => ({ default: mod.DocumentUploadZone })),
  {
    loading: () => (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" className="text-slate-600" />
      </div>
    ),
  }
)

/**
 * Page de capture de document
 * Permet de prendre une photo ou d'uploader un fichier
 */
export default function CapturePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const documentType = searchParams.get('type') || 'justificatif'
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const pageTitle = documentType === 'ticket' ? 'Ticket / Reçu' : 'Pièce justificative'

  /**
   * Gère l'upload du fichier vers l'API
   */
  const handleUpload = async (file: File) => {
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', documentType)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de l\'envoi')
      }

      setUploadSuccess(true)
    } catch (error) {
      console.error('Erreur upload:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'envoi')
    } finally {
      setIsUploading(false)
    }
  }

  // Écran de succès
  if (uploadSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle className="mb-4 h-16 w-16 text-green-500" />
        <h2 className="mb-2 text-xl font-bold">Document envoyé !</h2>
        <p className="mb-6 text-slate-600">
          Votre document a été transmis à votre fiduciaire.
        </p>
        <div className="flex gap-4">
          <Button onClick={() => setUploadSuccess(false)} variant="outline">
            Envoyer un autre document
          </Button>
          <Button onClick={() => router.push('/client/documents')}>
            Voir mes documents
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{pageTitle}</h1>
        <p className="text-slate-600">
          Prenez une photo ou sélectionnez un fichier
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nouveau document</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentUploadZone onUpload={handleUpload} isUploading={isUploading} />
        </CardContent>
      </Card>

      {/* Conseils */}
      <Card>
        <CardHeader>
          <CardTitle>Conseils pour une bonne photo</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
            <li>Placez le document sur une surface plane et bien éclairée</li>
            <li>Évitez les reflets et les ombres</li>
            <li>Assurez-vous que le texte est lisible</li>
            <li>Cadrez tout le document dans la photo</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
