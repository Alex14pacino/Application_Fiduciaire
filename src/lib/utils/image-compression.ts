/**
 * Utilitaire de compression d'images côté client
 * Réduit la taille des images avant l'upload pour améliorer les performances
 */

interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1200,   // Largeur max pour les documents
  maxHeight: 1600,  // Hauteur max pour les documents
  quality: 0.8,     // Qualité JPEG (80%)
}

/**
 * Compresse une image en redimensionnant et en réduisant la qualité
 * @param file Le fichier image à compresser
 * @param options Options de compression
 * @returns Un nouveau Blob compressé
 */
export async function compressImage(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  return new Promise((resolve, reject) => {
    // Crée un élément image pour charger le fichier
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      // Calcule les nouvelles dimensions en conservant le ratio
      let { width, height } = img
      const maxWidth = opts.maxWidth!
      const maxHeight = opts.maxHeight!

      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      // Crée un canvas pour redimensionner l'image
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Impossible de créer le contexte canvas'))
        return
      }

      // Dessine l'image redimensionnée
      ctx.drawImage(img, 0, 0, width, height)

      // Convertit en blob compressé
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Échec de la compression'))
          }
        },
        'image/jpeg',
        opts.quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Impossible de charger l\'image'))
    }

    img.src = url
  })
}

/**
 * Compresse une image si nécessaire (seulement si > 500KB)
 * Retourne le fichier original si ce n'est pas une image ou si déjà petit
 */
export async function compressImageIfNeeded(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  // Ne compresse que les images
  if (!file.type.startsWith('image/')) {
    return file
  }

  // Ne compresse pas si déjà petit (< 500KB)
  if (file.size < 500 * 1024) {
    return file
  }

  try {
    const compressedBlob = await compressImage(file, options)

    // Retourne un nouveau File avec le même nom
    return new File([compressedBlob], file.name, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })
  } catch (error) {
    console.error('Erreur compression image:', error)
    // En cas d'erreur, retourne le fichier original
    return file
  }
}
