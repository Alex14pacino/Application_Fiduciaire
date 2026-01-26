import Link from 'next/link'
import { User, FileText, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'

export const metadata = {
  title: 'Clients - FiduDocs',
}

/**
 * Page listant tous les clients du fiduciaire
 */
export default async function ClientsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Récupère l'ID du fiduciaire
  const { data: fiduciary } = await supabase
    .from('fiduciaries')
    .select('id')
    .eq('profile_id', user!.id)
    .single()

  // Récupère les clients avec leurs profils
  const { data: clients } = await supabase
    .from('clients')
    .select(`
      id,
      created_at,
      profile:profiles(full_name, email)
    `)
    .eq('fiduciary_id', fiduciary?.id || '')
    .order('created_at', { ascending: false })

  // Compte les documents par client
  const clientsWithDocCount = await Promise.all(
    (clients || []).map(async (client) => {
      const { count } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', client.id)

      return { ...client, documentsCount: count || 0 }
    })
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
        <p className="text-slate-600">
          {clientsWithDocCount.length} client{clientsWithDocCount.length > 1 ? 's' : ''}
        </p>
      </div>

      {clientsWithDocCount.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-slate-500">Aucun client pour le moment</p>
            <p className="mt-2 text-sm text-slate-400">
              Partagez votre ID fiduciaire pour que vos clients puissent s&apos;inscrire
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clientsWithDocCount.map((client) => {
            const profile = client.profile as unknown as { full_name: string | null; email: string } | null
            return (
              <Link key={client.id} href={`/fiduciary/clients/${client.id}/documents`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                        <User className="h-5 w-5 text-slate-600" />
                      </div>
                      <div className="flex-1 truncate">
                        <p className="font-medium truncate">
                          {profile?.full_name || 'Sans nom'}
                        </p>
                        <p className="text-sm text-slate-500 truncate">
                          {profile?.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-slate-500">
                        <FileText className="mr-1 h-4 w-4" />
                        {client.documentsCount} document{client.documentsCount > 1 ? 's' : ''}
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
