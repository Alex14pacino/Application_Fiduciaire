import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Page d'accueil
 * Redirige automatiquement vers le bon dashboard selon le rôle
 */
export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Récupère le rôle de l'utilisateur
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'fiduciary') {
    redirect('/fiduciary/dashboard')
  } else {
    redirect('/client/dashboard')
  }
}
