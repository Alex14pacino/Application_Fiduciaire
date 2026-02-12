import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes publiques qui n'ont pas besoin de vérification auth du tout
const fullyPublicRoutes = ['/install', '/auth/callback', '/api']

// Routes publiques qui peuvent rediriger si déjà connecté
const authRoutes = ['/login', '/signup', '/forgot-password']

// Routes réservées aux clients
const clientRoutes = ['/client']

// Routes réservées aux fiduciaires
const fiduciaryRoutes = ['/fiduciary']

/**
 * Middleware Next.js pour la protection des routes
 * - Vérifie l'authentification
 * - Redirige selon le rôle de l'utilisateur
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Routes totalement publiques - pas de vérification Supabase
  if (fullyPublicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Pour toutes les autres routes, on vérifie la session
  const { supabaseResponse, user, supabase } = await updateSession(request)

  // Routes d'authentification (login/signup)
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    // Si l'utilisateur est connecté, rediriger vers son dashboard
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const redirectUrl =
        profile?.role === 'fiduciary' ? '/fiduciary/dashboard' : '/client/dashboard'
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }
    return supabaseResponse
  }

  // Redirige vers login si non authentifié
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Récupère le rôle de l'utilisateur
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role

  // Vérifie l'accès aux routes client
  if (clientRoutes.some((route) => pathname.startsWith(route))) {
    if (role !== 'client') {
      return NextResponse.redirect(new URL('/fiduciary/dashboard', request.url))
    }
  }

  // Vérifie l'accès aux routes fiduciaire
  if (fiduciaryRoutes.some((route) => pathname.startsWith(route))) {
    if (role !== 'fiduciary') {
      return NextResponse.redirect(new URL('/client/dashboard', request.url))
    }
  }

  // Redirige la racine vers le bon dashboard
  if (pathname === '/') {
    const redirectUrl =
      role === 'fiduciary' ? '/fiduciary/dashboard' : '/client/dashboard'
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Correspond à toutes les routes sauf :
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation d'images)
     * - favicon.ico
     * - Images et autres fichiers statiques
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
