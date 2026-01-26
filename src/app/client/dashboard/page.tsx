import Link from 'next/link'
import { FileText, Receipt } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Tableau de bord - FiduDocs',
}

/**
 * Page d'accueil du client
 * Affiche un résumé et les actions principales
 */
export default async function ClientDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Récupère les infos du client
  const { data: clientData } = await supabase
    .from('clients')
    .select(`
      id,
      fiduciary:fiduciaries(company_name)
    `)
    .eq('profile_id', user!.id)
    .single()

  const client = clientData as { id: string; fiduciary: { company_name: string | null } | null } | null

  // Compte les documents
  let documentsCount = 0
  if (client?.id) {
    const { count } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', client.id)
    documentsCount = count || 0
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 px-4">
      {/* Message de bienvenue */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Bienvenue</h1>
        {client?.fiduciary && (
          <p className="text-slate-600">
            Fiduciaire : {(client.fiduciary as { company_name: string | null }).company_name || 'Non spécifié'}
          </p>
        )}
      </div>

      {/* Boutons d'action */}
      <div className="w-full max-w-sm space-y-4">
        <Link href="/client/capture?type=justificatif" className="block">
          <Button className="w-full h-16 text-lg" size="lg">
            <FileText className="mr-3 h-6 w-6" />
            Pièces justificatives
          </Button>
        </Link>

        <Link href="/client/capture?type=ticket" className="block">
          <Button className="w-full h-16 text-lg" variant="outline" size="lg">
            <Receipt className="mr-3 h-6 w-6" />
            Ticket / Reçu
          </Button>
        </Link>
      </div>

      {/* Compteur de documents */}
      <p className="text-sm text-slate-500">
        {documentsCount === 0
          ? 'Aucun document envoyé'
          : `${documentsCount} document${documentsCount > 1 ? 's' : ''} envoyé${documentsCount > 1 ? 's' : ''}`}
      </p>
    </div>
  )
}
