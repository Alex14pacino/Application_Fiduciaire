import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * Route API pour récupérer l'URL signée d'un document (thumbnail)
 * GET /api/documents/[id]/thumbnail
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: document, error } = await supabase
      .from('documents')
      .select('file_path, mime_type')
      .eq('id', id)
      .single()

    if (error || !document) {
      return NextResponse.json(
        { error: 'Document non trouvé' },
        { status: 404 }
      )
    }

    // Génère une URL signée avec transformation pour thumbnail (300px de large)
    // Cela réduit significativement la taille du fichier téléchargé
    const { data: signedUrlData } = await supabase.storage
      .from('document-uploads')
      .createSignedUrl(document.file_path, 3600, {
        transform: {
          width: 300,
          height: 400,
          resize: 'contain',
          quality: 75,
        },
      })

    return NextResponse.json({
      signedUrl: signedUrlData?.signedUrl,
    })
  } catch (error) {
    console.error('Erreur thumbnail:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
