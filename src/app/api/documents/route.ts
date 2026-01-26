import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Route API pour lister les documents
 * GET /api/documents
 *
 * Query params:
 * - clientId: optionnel, filtre par client (pour les fiduciaires)
 * - limit: optionnel, nombre de documents (défaut: 50)
 * - offset: optionnel, pagination
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Récupère le profil pour déterminer le rôle
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    let query = supabase
      .from('documents')
      .select(
        `
        *,
        client:clients(
          id,
          profile:profiles(full_name, email)
        )
      `
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Pour les clients, filtre sur leurs propres documents
    if (profile?.role === 'client') {
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('profile_id', user.id)
        .single()

      if (client) {
        query = query.eq('client_id', client.id)
      }
    } else if (clientId) {
      // Pour les fiduciaires, filtre par client si spécifié
      query = query.eq('client_id', clientId)
    }

    const { data: documents, error } = await query

    if (error) {
      console.error('Erreur récupération documents:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération' },
        { status: 500 }
      )
    }

    // Génère les URLs signées pour les images
    const documentsWithUrls = await Promise.all(
      (documents || []).map(async (doc) => {
        if (doc.mime_type.startsWith('image/')) {
          const { data } = await supabase.storage
            .from('document-uploads')
            .createSignedUrl(doc.file_path, 3600) // 1 heure

          return { ...doc, signedUrl: data?.signedUrl }
        }
        return doc
      })
    )

    return NextResponse.json({ documents: documentsWithUrls })
  } catch (error) {
    console.error('Erreur documents:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
