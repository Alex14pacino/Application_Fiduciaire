import type { MetadataRoute } from 'next'

/**
 * Configuration PWA pour l'application mobile
 * Permet l'installation de l'app sur Android et iOS
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FiduDocs - Gestion Documentaire',
    short_name: 'FiduDocs',
    description: 'Capturez et gérez vos justificatifs pour votre fiduciaire',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f172a',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
