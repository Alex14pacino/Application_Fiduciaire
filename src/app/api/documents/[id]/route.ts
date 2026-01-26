import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * Route API pour récupérer un document par ID
 * GET /api/documents/[id]
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
      .select(
        `
        *,
        client:clients(
          id,
          profile:profiles(full_name, email)
        )
      `
      )
      .eq('id', id)
      .single()

    if (error || !document) {
      return NextResponse.json(
        { error: 'Document non trouvé' },
        { status: 404 }
      )
    }

    // Génère une URL signée
    const { data: signedUrlData } = await supabase.storage
      .from('document-uploads')
      .createSignedUrl(document.file_path, 3600)

    return NextResponse.json({
      document: { ...document, signedUrl: signedUrlData?.signedUrl },
    })
  } catch (error) {
    console.error('Erreur document:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * Route API pour supprimer un document
 * DELETE /api/documents/[id]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupère le document pour vérifier les droits et obtenir le file_path
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('id, file_path, client_id')
      .eq('id', id)
      .single()

    if (fetchError || !document) {
      return NextResponse.json(
        { error: 'Document non trouvé' },
        { status: 404 }
      )
    }

    // Supprime le fichier du storage
    const { error: storageError } = await supabase.storage
      .from('document-uploads')
      .remove([document.file_path])

    if (storageError) {
      console.error('Erreur suppression storage:', storageError)
    }

    // Supprime l'enregistrement de la base de données
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Erreur suppression document:', deleteError)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur suppression:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
