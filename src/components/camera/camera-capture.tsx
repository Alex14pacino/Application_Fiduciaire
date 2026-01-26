'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { X, SwitchCamera, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

interface CameraCaptureProps {
  onCapture: (blob: Blob, dataUrl: string) => void
  onClose?: () => void
}

/**
 * Composant de capture photo avec accès à la caméra
 * Utilise l'API getUserMedia pour accéder à la caméra du device
 */
export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)

  /**
   * Démarre la caméra avec la direction spécifiée
   */
  const startCamera = useCallback(async () => {
    try {
      // Arrête le stream existant si présent
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })

      setStream(mediaStream)
      setHasPermission(true)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error('Erreur accès caméra:', error)
      setHasPermission(false)
    }
  }, [facingMode, stream])

  /**
   * Arrête la caméra et libère les ressources
   */
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }, [stream])

  /**
   * Capture une photo depuis le flux vidéo
   */
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    setIsCapturing(true)

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Dessine l'image actuelle de la vidéo sur le canvas
    ctx.drawImage(video, 0, 0)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setCapturedImage(dataUrl)
    setIsCapturing(false)
  }, [])

  /**
   * Confirme la capture et envoie l'image
   */
  const confirmCapture = useCallback(() => {
    if (!capturedImage || !canvasRef.current) return

    canvasRef.current.toBlob(
      (blob) => {
        if (blob) {
          onCapture(blob, capturedImage)
        }
      },
      'image/jpeg',
      0.9
    )
  }, [capturedImage, onCapture])

  /**
   * Reprend une nouvelle photo
   */
  const retake = useCallback(() => {
    setCapturedImage(null)
  }, [])

  /**
   * Change la caméra (avant/arrière)
   */
  const switchCamera = useCallback(() => {
    stopCamera()
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
  }, [stopCamera])

  /**
   * Ferme la caméra
   */
  const handleClose = useCallback(() => {
    stopCamera()
    onClose?.()
  }, [stopCamera, onClose])

  // Démarre la caméra au montage et quand facingMode change
  useEffect(() => {
    startCamera()
    return () => stopCamera()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode])

  // Écran de demande de permission
  if (hasPermission === false) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-black p-4 text-white">
        <Camera className="mb-4 h-16 w-16 text-slate-400" />
        <h2 className="mb-2 text-xl font-semibold">Accès caméra refusé</h2>
        <p className="mb-4 text-center text-slate-300">
          Veuillez autoriser l&apos;accès à la caméra dans les paramètres de votre navigateur.
        </p>
        <div className="flex gap-2">
          <Button onClick={startCamera} variant="outline">
            Réessayer
          </Button>
          {onClose && (
            <Button onClick={handleClose} variant="secondary">
              Fermer
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Écran de prévisualisation après capture
  if (capturedImage) {
    return (
      <div className="relative h-full w-full bg-black">
        {/* Image capturée */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={capturedImage}
          alt="Photo capturée"
          className="h-full w-full object-contain"
        />

        {/* Boutons d'action */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 bg-gradient-to-t from-black/80 to-transparent p-6">
          <Button onClick={retake} variant="outline" size="lg">
            Reprendre
          </Button>
          <Button onClick={confirmCapture} size="lg">
            Utiliser cette photo
          </Button>
        </div>
      </div>
    )
  }

  // Écran de capture
  return (
    <div className="relative h-full w-full bg-black">
      {/* Flux vidéo */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover"
      />

      {/* Canvas caché pour la capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Bouton fermer */}
      {onClose && (
        <Button
          onClick={handleClose}
          variant="ghost"
          size="icon"
          className="absolute left-4 top-4 text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>
      )}

      {/* Bouton changer de caméra */}
      <Button
        onClick={switchCamera}
        variant="ghost"
        size="icon"
        className="absolute right-4 top-4 text-white hover:bg-white/20"
      >
        <SwitchCamera className="h-6 w-6" />
      </Button>

      {/* Bouton de capture */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center bg-gradient-to-t from-black/80 to-transparent p-6">
        <button
          onClick={capturePhoto}
          disabled={isCapturing}
          className={cn(
            'h-16 w-16 rounded-full border-4 border-white bg-white/20 transition-transform',
            'hover:scale-110 active:scale-95',
            'disabled:opacity-50'
          )}
          aria-label="Prendre une photo"
        >
          <span className="sr-only">Prendre une photo</span>
        </button>
      </div>
    </div>
  )
}
