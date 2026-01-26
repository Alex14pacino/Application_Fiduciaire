'use client'

import { useCallback, useState, useRef } from 'react'
import { Upload, Camera, FileImage } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CameraCapture } from '@/components/camera/camera-capture'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { cn } from '@/lib/utils/cn'

interface DocumentUploadZoneProps {
  onUpload: (file: File) => Promise<void>
  isUploading?: boolean
}

/**
 * Zone d'upload de documents avec support drag & drop et capture caméra
 */
export function DocumentUploadZone({
  onUpload,
  isUploading,
}: DocumentUploadZoneProps) {
  const [showCamera, setShowCamera] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  /**
   * Vérifie si le fichier est valide
   */
  const validateFile = (file: File): boolean => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ]
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!allowedTypes.includes(file.type)) {
      alert('Type de fichier non supporté. Utilisez JPG, PNG, WebP ou PDF.')
      return false
    }

    if (file.size > maxSize) {
      alert('Le fichier est trop volumineux. Maximum 10MB.')
      return false
    }

    return true
  }

  /**
   * Traite le fichier sélectionné
   */
  const handleFile = useCallback((file: File) => {
    if (!validateFile(file)) return

    setSelectedFile(file)

    // Génère un aperçu pour les images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }, [])

  /**
   * Gère le drop de fichiers
   */
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragActive(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  /**
   * Gère le drag over
   */
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragActive(true)
  }, [])

  /**
   * Gère le drag leave
   */
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragActive(false)
  }, [])

  /**
   * Gère la sélection de fichier via input
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  /**
   * Gère la capture caméra
   */
  const handleCameraCapture = useCallback(
    (blob: Blob) => {
      const file = new File([blob], `capture-${Date.now()}.jpg`, {
        type: 'image/jpeg',
      })
      setShowCamera(false)
      handleFile(file)
    },
    [handleFile]
  )

  /**
   * Confirme l'upload du fichier
   */
  const handleConfirmUpload = useCallback(async () => {
    if (!selectedFile) return

    await onUpload(selectedFile)

    // Réinitialise l'état
    setSelectedFile(null)
    setPreviewUrl(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [selectedFile, onUpload])

  /**
   * Annule la sélection
   */
  const handleCancel = useCallback(() => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [previewUrl])

  // Mode caméra plein écran
  if (showCamera) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      </div>
    )
  }

  // Prévisualisation du fichier sélectionné
  if (selectedFile) {
    return (
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Aperçu du document"
              className="mx-auto max-h-64 object-contain"
            />
          ) : (
            <div className="flex items-center justify-center p-8">
              <FileImage className="h-16 w-16 text-slate-400" />
            </div>
          )}
        </div>

        <p className="text-center text-sm text-slate-600">
          {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} Ko)
        </p>

        <div className="flex gap-2">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="flex-1"
            disabled={isUploading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirmUpload}
            className="flex-1"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Envoi...
              </>
            ) : (
              'Envoyer'
            )}
          </Button>
        </div>
      </div>
    )
  }

  // Zone de drop et sélection
  return (
    <div className="space-y-4">
      {/* Zone drag & drop */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          isDragActive
            ? 'border-slate-900 bg-slate-100'
            : 'border-slate-300 hover:border-slate-400',
          isUploading && 'pointer-events-none opacity-50'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleInputChange}
          className="hidden"
          disabled={isUploading}
        />

        <Upload className="mx-auto mb-4 h-12 w-12 text-slate-400" />
        <p className="text-sm text-slate-600">
          {isDragActive
            ? 'Déposez le fichier ici...'
            : 'Glissez-déposez un document, ou cliquez pour sélectionner'}
        </p>
        <p className="mt-2 text-xs text-slate-400">
          JPG, PNG, WebP ou PDF jusqu&apos;à 10 Mo
        </p>
      </div>

      {/* Séparateur */}
      <div className="text-center">
        <span className="text-sm text-slate-400">ou</span>
      </div>

      {/* Bouton caméra */}
      <Button
        onClick={() => setShowCamera(true)}
        variant="outline"
        className="w-full"
        disabled={isUploading}
      >
        <Camera className="mr-2 h-4 w-4" />
        Prendre une photo
      </Button>
    </div>
  )
}
