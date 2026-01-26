import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'

/**
 * Layout pour les pages client
 * Inclut l'en-tête et la navigation mobile
 */
export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Récupère le profil pour afficher le nom
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  // Vérifie que c'est bien un client
  if (profile?.role !== 'client') {
    redirect('/fiduciary/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header userName={profile?.full_name} userRole="client" />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-4 md:pb-8">
        {children}
      </main>
      <MobileNav />
    </div>
  )
}
