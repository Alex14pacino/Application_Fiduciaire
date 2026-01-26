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
// Constantes pour les dimensions du cadre de guidage (en pourcentage)
const FRAME_TOP = 0.15    // 15% depuis le haut
const FRAME_BOTTOM = 0.25 // 25% depuis le bas
const FRAME_LEFT = 0.05   // 5% depuis la gauche
const FRAME_RIGHT = 0.05  // 5% depuis la droite

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cropCanvasRef = useRef<HTMLCanvasElement>(null)
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
   * Capture une photo depuis le flux vidéo et la recadre selon le cadre vert
   */
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !cropCanvasRef.current) return

    setIsCapturing(true)

    const video = videoRef.current
    const fullCanvas = canvasRef.current
    const cropCanvas = cropCanvasRef.current

    // Capture l'image complète d'abord
    fullCanvas.width = video.videoWidth
    fullCanvas.height = video.videoHeight

    const fullCtx = fullCanvas.getContext('2d')
    if (!fullCtx) return

    fullCtx.drawImage(video, 0, 0)

    // Calcule les coordonnées de recadrage basées sur le cadre vert
    const cropX = video.videoWidth * FRAME_LEFT
    const cropY = video.videoHeight * FRAME_TOP
    const cropWidth = video.videoWidth * (1 - FRAME_LEFT - FRAME_RIGHT)
    const cropHeight = video.videoHeight * (1 - FRAME_TOP - FRAME_BOTTOM)

    // Configure le canvas de recadrage
    cropCanvas.width = cropWidth
    cropCanvas.height = cropHeight

    const cropCtx = cropCanvas.getContext('2d')
    if (!cropCtx) return

    // Dessine uniquement la zone du cadre vert
    cropCtx.drawImage(
      fullCanvas,
      cropX, cropY, cropWidth, cropHeight,  // Source (zone à recadrer)
      0, 0, cropWidth, cropHeight            // Destination (canvas entier)
    )

    const dataUrl = cropCanvas.toDataURL('image/jpeg', 0.9)
    setCapturedImage(dataUrl)
    setIsCapturing(false)
  }, [])

  /**
   * Confirme la capture et envoie l'image recadrée
   */
  const confirmCapture = useCallback(() => {
    if (!capturedImage || !cropCanvasRef.current) return

    cropCanvasRef.current.toBlob(
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

        {/* Boutons d'action - pb-24 pour laisser de l'espace pour la barre de navigation mobile */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 bg-gradient-to-t from-black/80 to-transparent px-6 pb-24 pt-6">
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

      {/* Canvas cachés pour la capture et le recadrage */}
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={cropCanvasRef} className="hidden" />

      {/* Overlay sombre avec cadre de guidage */}
      <div className="pointer-events-none absolute inset-0">
        {/* Zone sombre en haut */}
        <div className="absolute left-0 right-0 top-0 h-[15%] bg-black/50" />
        {/* Zone sombre en bas */}
        <div className="absolute bottom-0 left-0 right-0 h-[25%] bg-black/50" />
        {/* Zone sombre à gauche */}
        <div className="absolute bottom-[25%] left-0 top-[15%] w-[5%] bg-black/50" />
        {/* Zone sombre à droite */}
        <div className="absolute bottom-[25%] right-0 top-[15%] w-[5%] bg-black/50" />

        {/* Cadre de guidage vert */}
        <div className="absolute bottom-[25%] left-[5%] right-[5%] top-[15%] border-2 border-green-400 rounded-lg">
          {/* Coins accentués */}
          <div className="absolute -left-0.5 -top-0.5 h-6 w-6 border-l-4 border-t-4 border-green-400 rounded-tl-lg" />
          <div className="absolute -right-0.5 -top-0.5 h-6 w-6 border-r-4 border-t-4 border-green-400 rounded-tr-lg" />
          <div className="absolute -bottom-0.5 -left-0.5 h-6 w-6 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
          <div className="absolute -bottom-0.5 -right-0.5 h-6 w-6 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
        </div>

        {/* Texte d'instruction */}
        <div className="absolute left-0 right-0 top-[5%] text-center">
          <p className="text-white text-sm font-medium drop-shadow-lg">
            Placez le document dans le cadre
          </p>
        </div>
      </div>

      {/* Bouton fermer */}
      {onClose && (
        <Button
          onClick={handleClose}
          variant="ghost"
          size="icon"
          className="absolute left-4 top-4 text-white hover:bg-white/20 z-10"
        >
          <X className="h-6 w-6" />
        </Button>
      )}

      {/* Bouton changer de caméra */}
      <Button
        onClick={switchCamera}
        variant="ghost"
        size="icon"
        className="absolute right-4 top-4 text-white hover:bg-white/20 z-10"
      >
        <SwitchCamera className="h-6 w-6" />
      </Button>

      {/* Bouton de capture - pb-24 pour laisser de l'espace pour la barre de navigation mobile */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center bg-gradient-to-t from-black/80 to-transparent px-6 pb-24 pt-6 z-10">
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
