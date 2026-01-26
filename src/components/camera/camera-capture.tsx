'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { X, SwitchCamera, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

interface CameraCaptureProps {
  onCapture: (blob: Blob, dataUrl: string) => void
  onClose?: () => void
}

// Ratio A4 : largeur / hauteur = 21 / 29.7 = 0.707
const A4_RATIO = 21 / 29.7

// Marges fixes
const MARGIN_TOP = 0.08      // 8% depuis le haut (espace pour les boutons et texte)
const MARGIN_BOTTOM = 0.20   // 20% depuis le bas (espace pour le bouton capture)

/**
 * Calcule les dimensions du cadre A4 en fonction des dimensions de l'écran
 * Le cadre aura toujours les proportions exactes d'une page A4
 */
function calculateA4Frame(containerWidth: number, containerHeight: number) {
  // Zone disponible pour le cadre (en tenant compte des marges haut/bas)
  const availableHeight = containerHeight * (1 - MARGIN_TOP - MARGIN_BOTTOM)
  const availableWidth = containerWidth * 0.90 // 90% de la largeur max

  // Calcule les dimensions du cadre en respectant le ratio A4
  let frameWidth: number
  let frameHeight: number

  // On essaie d'abord avec la hauteur disponible
  frameHeight = availableHeight
  frameWidth = frameHeight * A4_RATIO

  // Si le cadre est trop large, on ajuste par la largeur
  if (frameWidth > availableWidth) {
    frameWidth = availableWidth
    frameHeight = frameWidth / A4_RATIO
  }

  // Calcule les positions (centré horizontalement)
  const left = (containerWidth - frameWidth) / 2
  const top = containerHeight * MARGIN_TOP
  const right = containerWidth - left - frameWidth
  const bottom = containerHeight - top - frameHeight

  // Retourne les pourcentages
  return {
    top: top / containerHeight,
    bottom: bottom / containerHeight,
    left: left / containerWidth,
    right: right / containerWidth,
    width: frameWidth,
    height: frameHeight,
  }
}

/**
 * Composant de capture photo avec accès à la caméra
 * Utilise l'API getUserMedia pour accéder à la caméra du device
 */
export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cropCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [frameStyle, setFrameStyle] = useState({
    top: '8%',
    bottom: '20%',
    left: '15%',
    right: '15%',
  })
  const [framePercentages, setFramePercentages] = useState({
    top: 0.08,
    bottom: 0.20,
    left: 0.15,
    right: 0.15,
  })

  /**
   * Met à jour les dimensions du cadre lors du redimensionnement
   */
  const updateFrameDimensions = useCallback(() => {
    if (!containerRef.current) return

    const { clientWidth, clientHeight } = containerRef.current
    const frame = calculateA4Frame(clientWidth, clientHeight)

    setFrameStyle({
      top: `${(frame.top * 100).toFixed(2)}%`,
      bottom: `${(frame.bottom * 100).toFixed(2)}%`,
      left: `${(frame.left * 100).toFixed(2)}%`,
      right: `${(frame.right * 100).toFixed(2)}%`,
    })

    setFramePercentages({
      top: frame.top,
      bottom: frame.bottom,
      left: frame.left,
      right: frame.right,
    })
  }, [])

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
   * Capture une photo depuis le flux vidéo et la recadre selon le cadre A4
   * L'image est redimensionnée et compressée pour optimiser la taille du fichier
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

    // Calcule les coordonnées de recadrage basées sur le cadre A4
    const cropX = video.videoWidth * framePercentages.left
    const cropY = video.videoHeight * framePercentages.top
    const cropWidth = video.videoWidth * (1 - framePercentages.left - framePercentages.right)
    const cropHeight = video.videoHeight * (1 - framePercentages.top - framePercentages.bottom)

    // Limite la taille maximale pour optimiser le poids du fichier
    const MAX_WIDTH = 1200
    const MAX_HEIGHT = 1600
    let finalWidth = cropWidth
    let finalHeight = cropHeight

    if (finalWidth > MAX_WIDTH) {
      finalHeight = (finalHeight * MAX_WIDTH) / finalWidth
      finalWidth = MAX_WIDTH
    }
    if (finalHeight > MAX_HEIGHT) {
      finalWidth = (finalWidth * MAX_HEIGHT) / finalHeight
      finalHeight = MAX_HEIGHT
    }

    // Configure le canvas de recadrage avec les dimensions optimisées
    cropCanvas.width = finalWidth
    cropCanvas.height = finalHeight

    const cropCtx = cropCanvas.getContext('2d')
    if (!cropCtx) return

    // Dessine uniquement la zone du cadre A4, redimensionnée
    cropCtx.drawImage(
      fullCanvas,
      cropX, cropY, cropWidth, cropHeight,  // Source (zone à recadrer)
      0, 0, finalWidth, finalHeight          // Destination (dimensions optimisées)
    )

    // Qualité 0.8 pour un bon compromis taille/qualité
    const dataUrl = cropCanvas.toDataURL('image/jpeg', 0.8)
    setCapturedImage(dataUrl)
    setIsCapturing(false)
  }, [framePercentages])

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
      0.8  // Qualité 80% pour réduire la taille
    )
  }, [capturedImage, onCapture])

  /**
   * Reprend une nouvelle photo - redémarre la caméra
   */
  const retake = useCallback(async () => {
    setCapturedImage(null)
    // Redémarre la caméra après avoir effacé l'image
    await startCamera()
  }, [startCamera])

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

  // Met à jour les dimensions du cadre au montage et lors du redimensionnement
  useEffect(() => {
    updateFrameDimensions()
    window.addEventListener('resize', updateFrameDimensions)
    return () => window.removeEventListener('resize', updateFrameDimensions)
  }, [updateFrameDimensions])

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
    <div ref={containerRef} className="relative h-full w-full bg-black">
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

      {/* Overlay sombre avec cadre de guidage format A4 */}
      <div className="pointer-events-none absolute inset-0">
        {/* Zone sombre en haut */}
        <div
          className="absolute left-0 right-0 top-0 bg-black/50"
          style={{ height: frameStyle.top }}
        />
        {/* Zone sombre en bas */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-black/50"
          style={{ height: frameStyle.bottom }}
        />
        {/* Zone sombre à gauche */}
        <div
          className="absolute left-0 bg-black/50"
          style={{
            top: frameStyle.top,
            bottom: frameStyle.bottom,
            width: frameStyle.left
          }}
        />
        {/* Zone sombre à droite */}
        <div
          className="absolute right-0 bg-black/50"
          style={{
            top: frameStyle.top,
            bottom: frameStyle.bottom,
            width: frameStyle.right
          }}
        />

        {/* Cadre de guidage vert format A4 */}
        <div
          className="absolute border-2 border-green-400 rounded-lg"
          style={{
            top: frameStyle.top,
            bottom: frameStyle.bottom,
            left: frameStyle.left,
            right: frameStyle.right,
          }}
        >
          {/* Coins accentués */}
          <div className="absolute -left-0.5 -top-0.5 h-8 w-8 border-l-4 border-t-4 border-green-400 rounded-tl-lg" />
          <div className="absolute -right-0.5 -top-0.5 h-8 w-8 border-r-4 border-t-4 border-green-400 rounded-tr-lg" />
          <div className="absolute -bottom-0.5 -left-0.5 h-8 w-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
          <div className="absolute -bottom-0.5 -right-0.5 h-8 w-8 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
        </div>

        {/* Texte d'instruction */}
        <div className="absolute left-0 right-0 top-[2%] text-center">
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
