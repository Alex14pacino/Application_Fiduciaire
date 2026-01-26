import { z } from 'zod'

/**
 * Schéma de validation pour le formulaire de connexion
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'adresse email est requise')
    .email('Adresse email invalide'),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
})

export type LoginFormData = z.infer<typeof loginSchema>

/**
 * Schéma de validation pour le formulaire d'inscription client
 */
export const signupSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Le nom complet est requis')
    .min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z
    .string()
    .min(1, 'L\'adresse email est requise')
    .email('Adresse email invalide'),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  fiduciaryId: z
    .string()
    .min(1, 'L\'ID du fiduciaire est requis'),
})

export type SignupFormData = z.infer<typeof signupSchema>
