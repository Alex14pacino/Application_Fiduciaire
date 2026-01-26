import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { Sidebar, FiduciaryMobileNav } from '@/components/layout/sidebar'

/**
 * Layout pour les pages fiduciaire
 * Inclut l'en-tête, la sidebar desktop et la navigation mobile
 */
export default async function FiduciaryLayout({
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

  // Récupère le profil pour afficher le nom et vérifier le rôle
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  // Vérifie que c'est bien un fiduciaire
  if (profile?.role !== 'fiduciary') {
    redirect('/client/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header userName={profile?.full_name} userRole="fiduciary" />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-4 pb-20 pt-4 md:px-8 md:pb-8">
          {children}
        </main>
      </div>
      <FiduciaryMobileNav />
    </div>
  )
}
