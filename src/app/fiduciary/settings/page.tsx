import { Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Paramètres - FiduDocs',
}

/**
 * Page des paramètres du fiduciaire
 */
export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Récupère le profil et les infos fiduciaire
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { data: fiduciary } = await supabase
    .from('fiduciaries')
    .select('*')
    .eq('profile_id', user!.id)
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
        <p className="text-slate-600">Gérez votre compte fiduciaire</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du compte</CardTitle>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations du cabinet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Nom du cabinet</p>
            <p className="text-slate-900">{fiduciary?.company_name || 'Non spécifié'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Adresse</p>
            <p className="text-slate-900">{fiduciary?.address || 'Non renseignée'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ID Fiduciaire</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-slate-100 p-4">
            <p className="text-center font-mono text-xl font-bold">
              {fiduciary?.fiduciary_id}
            </p>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Partagez cet identifiant avec vos clients pour qu&apos;ils puissent
            s&apos;inscrire et vous envoyer leurs documents.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Support</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-3">
            Besoin d&apos;aide ou une question ? Contactez notre équipe de support.
          </p>
          <a
            href="mailto:info@taskless.ch"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <Mail className="h-4 w-4" />
            info@taskless.ch
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
