import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Route de callback pour la confirmation d'email
 * Appelée après que l'utilisateur clique sur le lien dans l'email
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Redirige vers la page demandée après confirmation
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Redirige vers la page de connexion en cas d'erreur
  return NextResponse.redirect(`${origin}/login?message=Une erreur est survenue`)
}
