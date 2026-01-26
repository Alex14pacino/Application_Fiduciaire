import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Mon profil - FiduDocs',
}

/**
 * Page de profil du client
 * Affiche les informations du compte
 */
export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Récupère le profil complet
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  // Récupère les infos du client et du fiduciaire
  const { data: client } = await supabase
    .from('clients')
    .select(`
      *,
      fiduciary:fiduciaries(company_name, fiduciary_id)
    `)
    .eq('profile_id', user!.id)
    .single()

  const fiduciary = client?.fiduciary as { company_name: string | null; fiduciary_id: string } | null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mon profil</h1>
        <p className="text-slate-600">Vos informations de compte</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Nom</p>
            <p className="text-slate-900">{profile?.full_name || 'Non renseigné'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Email</p>
            <p className="text-slate-900">{profile?.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Membre depuis</p>
            <p className="text-slate-900">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : 'Inconnue'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mon fiduciaire</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Nom du cabinet</p>
            <p className="text-slate-900">{fiduciary?.company_name || 'Non spécifié'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">ID Fiduciaire</p>
            <p className="font-mono text-slate-900">{fiduciary?.fiduciary_id}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
