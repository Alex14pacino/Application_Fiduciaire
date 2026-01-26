'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { signupSchema, type SignupFormData } from '@/lib/validations/auth'

/**
 * Formulaire d'inscription pour les clients
 * Requiert un fiduciary_id valide pour créer le compte
 */
export function SignupForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [fiduciaryValidated, setFiduciaryValidated] = useState(false)
  const [fiduciaryName, setFiduciaryName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const fiduciaryIdValue = watch('fiduciaryId')

  /**
   * Valide que l'ID du fiduciaire existe dans la base de données
   */
  const validateFiduciaryId = async (fiduciaryId: string) => {
    if (!fiduciaryId || fiduciaryId.length < 3) {
      setFiduciaryValidated(false)
      setFiduciaryName(null)
      return
    }

    setIsValidating(true)

    try {
      const response = await fetch('/api/fiduciary/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fiduciary_id: fiduciaryId }),
      })

      const data = await response.json()

      if (data.valid) {
        setFiduciaryValidated(true)
        setFiduciaryName(data.fiduciary.company_name)
        setError(null)
      } else {
        setFiduciaryValidated(false)
        setFiduciaryName(null)
      }
    } catch {
      setFiduciaryValidated(false)
      setFiduciaryName(null)
    } finally {
      setIsValidating(false)
    }
  }

  const onSubmit = async (data: SignupFormData) => {
    if (!fiduciaryValidated) {
      setError('Veuillez entrer un ID de fiduciaire valide')
      return
    }

    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          role: 'client',
          fiduciary_id: data.fiduciaryId,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      setError(
        signUpError.message === 'User already registered'
          ? 'Un compte existe déjà avec cette adresse email'
          : signUpError.message
      )
      setIsLoading(false)
      return
    }

    // Redirige vers la page de connexion avec un message
    router.push('/login?message=Vérifiez votre email pour confirmer votre compte')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Message d'erreur */}
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Champ ID Fiduciaire */}
      <div className="space-y-2">
        <Label htmlFor="fiduciaryId">ID du fiduciaire</Label>
        <div className="relative">
          <Input
            id="fiduciaryId"
            placeholder="Ex: FID-ABC123"
            {...register('fiduciaryId')}
            onBlur={(e) => validateFiduciaryId(e.target.value)}
            disabled={isLoading}
          />
          {/* Indicateur de validation */}
          {fiduciaryIdValue && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isValidating ? (
                <LoadingSpinner size="sm" />
              ) : fiduciaryValidated ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <X className="h-5 w-5 text-red-500" />
              )}
            </div>
          )}
        </div>
        {/* Nom du fiduciaire validé */}
        {fiduciaryValidated && fiduciaryName && (
          <p className="text-sm text-green-600">
            Lié à : {fiduciaryName}
          </p>
        )}
        {errors.fiduciaryId && (
          <p className="text-sm text-red-500">{errors.fiduciaryId.message}</p>
        )}
      </div>

      {/* Champ Nom complet */}
      <div className="space-y-2">
        <Label htmlFor="fullName">Nom complet</Label>
        <Input
          id="fullName"
          placeholder="Jean Dupont"
          {...register('fullName')}
          disabled={isLoading}
        />
        {errors.fullName && (
          <p className="text-sm text-red-500">{errors.fullName.message}</p>
        )}
      </div>

      {/* Champ Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Adresse email</Label>
        <Input
          id="email"
          type="email"
          placeholder="nom@exemple.com"
          {...register('email')}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      {/* Champ Mot de passe */}
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          type="password"
          placeholder="Minimum 8 caractères"
          {...register('password')}
          disabled={isLoading}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      {/* Bouton d'inscription */}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <LoadingSpinner size="sm" /> : 'Créer mon compte'}
      </Button>

      {/* Lien vers la connexion */}
      <p className="text-center text-sm text-slate-600">
        Déjà un compte ?{' '}
        <Link href="/login" className="font-medium text-slate-900 hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  )
}
