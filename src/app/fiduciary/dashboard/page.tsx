import Link from 'next/link'
import { Users, FileText, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Tableau de bord - FiduDocs',
}

/**
 * Page d'accueil du fiduciaire
 * Affiche les statistiques et les actions principales
 */
export default async function FiduciaryDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Récupère l'ID du fiduciaire
  const { data: fiduciary } = await supabase
    .from('fiduciaries')
    .select('id, company_name, fiduciary_id')
    .eq('profile_id', user!.id)
    .single()

  // Compte les clients
  const { count: clientsCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('fiduciary_id', fiduciary?.id || '')

  // Compte les documents
  const { data: clients } = await supabase
    .from('clients')
    .select('id')
    .eq('fiduciary_id', fiduciary?.id || '')

  const clientIds = clients?.map((c) => c.id) || []

  let documentsCount = 0
  if (clientIds.length > 0) {
    const { count } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .in('client_id', clientIds)

    documentsCount = count || 0
  }

  // Clients récents (basé sur la date du dernier document envoyé)
  let recentClients: Array<{
    id: string
    profile: { full_name: string | null; email: string }
    last_document_date: string | null
  }> = []

  if (clientIds.length > 0) {
    // Récupère les clients avec leur dernier document
    const { data: clientsWithDocs } = await supabase
      .from('clients')
      .select(`
        id,
        profile:profiles(full_name, email),
        documents(created_at)
      `)
      .eq('fiduciary_id', fiduciary?.id || '')
      .order('created_at', { foreignTable: 'documents', ascending: false })

    // Trie les clients par date du dernier document
    const clientsWithLastDoc = (clientsWithDocs || []).map((client) => {
      const docs = (client.documents as Array<{ created_at: string }>) || []
      const lastDocDate = docs.length > 0
        ? docs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
        : null
      return {
        id: client.id,
        profile: client.profile as { full_name: string | null; email: string },
        last_document_date: lastDocDate,
      }
    })

    // Trie par date décroissante et prend les 5 premiers
    recentClients = clientsWithLastDoc
      .filter((c) => c.last_document_date !== null)
      .sort((a, b) => new Date(b.last_document_date!).getTime() - new Date(a.last_document_date!).getTime())
      .slice(0, 5)
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
        {fiduciary?.company_name && (
          <p className="text-slate-600">{fiduciary.company_name}</p>
        )}
      </div>

      {/* ID du fiduciaire */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="text-sm text-slate-500">Votre ID fiduciaire</p>
            <p className="font-mono text-lg font-medium">{fiduciary?.fiduciary_id}</p>
          </div>
          <p className="text-sm text-slate-500">
            Partagez cet ID avec vos clients pour qu&apos;ils puissent s&apos;inscrire
          </p>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Clients
            </CardTitle>
            <Users className="h-5 w-5 text-slate-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{clientsCount || 0}</p>
            <Link href="/fiduciary/clients">
              <Button variant="link" className="mt-2 h-auto p-0">
                Voir tous les clients
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Documents
            </CardTitle>
            <FileText className="h-5 w-5 text-slate-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{documentsCount}</p>
            <p className="mt-2 text-sm text-slate-500">
              Documents reçus de vos clients
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Clients récents */}
      <Card>
        <CardHeader>
          <CardTitle>Clients récents</CardTitle>
        </CardHeader>
        <CardContent>
          {recentClients.length === 0 ? (
            <p className="text-slate-500">Aucun client actif pour le moment</p>
          ) : (
            <div className="space-y-3">
              {recentClients.map((client) => (
                <Link
                  key={client.id}
                  href={`/fiduciary/clients/${client.id}/documents`}
                  className="flex items-center justify-between rounded-md border border-slate-200 p-3 hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{client.profile?.full_name || 'Client'}</p>
                    <p className="text-sm text-slate-500">
                      {client.profile?.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-400">
                      {client.last_document_date && new Date(client.last_document_date).toLocaleDateString('fr-FR')}
                    </p>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
