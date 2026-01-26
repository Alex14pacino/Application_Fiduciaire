import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utilitaire pour combiner les classes CSS avec Tailwind
 * Gère les conflits de classes automatiquement
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
