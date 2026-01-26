import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Configuration webhooks N8N
const N8N_USER = process.env.N8N_USER || 'N8nAppFiduciaire'
const N8N_PASSWORD = process.env.N8N_PASSWORD || 'x+1XW,sc|*D6SJ^`+yJE'

// Webhook pour les pièces justificatives
const N8N_WEBHOOK_JUSTIFICATIF = process.env.N8N_WEBHOOK_JUSTIFICATIF || 'https://n8n.srv1046329.hstgr.cloud/webhook/eb72ed88-14ee-42da-8636-674af86f5242'

// Webhook pour les tickets/reçus (à configurer plus tard)
const N8N_WEBHOOK_TICKET = process.env.N8N_WEBHOOK_TICKET || ''

/**
 * Envoie une notification au webhook N8N approprié selon le type de document
 */
async function notifyN8N(data: {
  documentId: string
  clientId: string
  fileName: string
  fileSize: number
  mimeType: string
  filePath: string
  uploadedAt: string
  userEmail: string
  documentType: string
}) {
  // Détermine quel webhook appeler selon le type
  const webhookUrl = data.documentType === 'ticket' ? N8N_WEBHOOK_TICKET : N8N_WEBHOOK_JUSTIFICATIF

  // Si pas de webhook configuré pour ce type, on ne fait rien
  if (!webhookUrl) {
    console.log(`Pas de webhook configuré pour le type: ${data.documentType}`)
    return
  }

  try {
    const credentials = Buffer.from(`${N8N_USER}:${N8N_PASSWORD}`).toString('base64')

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      console.error('Erreur webhook N8N:', response.status, await response.text())
    } else {
      console.log(`Webhook N8N (${data.documentType}) notifié avec succès`)
    }
  } catch (error) {
    console.error('Erreur appel webhook N8N:', error)
  }
}

/**
 * Route API pour uploader un fichier
 * POST /api/upload
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const documentType = (formData.get('documentType') as string) || 'justificatif'

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    // Validation du type de fichier
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non supporté' },
        { status: 400 }
      )
    }

    // Validation de la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux (max 10 Mo)' },
        { status: 400 }
      )
    }

    // Génère un nom de fichier unique
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const fileName = `${timestamp}-${crypto.randomUUID()}.${extension}`
    const filePath = `${user.id}/${fileName}`

    // Upload vers Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('document-uploads')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Erreur upload storage:', uploadError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'upload' },
        { status: 500 }
      )
    }

    // Récupère l'ID client de l'utilisateur
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('profile_id', user.id)
      .single()

    if (!client) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      )
    }

    // Crée l'enregistrement du document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        client_id: client.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single()

    if (docError) {
      console.error('Erreur création document:', docError)
      return NextResponse.json(
        { error: 'Erreur lors de la création du document' },
        { status: 500 }
      )
    }

    // Notifie le webhook N8N approprié selon le type de document
    notifyN8N({
      documentId: document.id,
      clientId: client.id,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      filePath: filePath,
      uploadedAt: document.created_at,
      userEmail: user.email || '',
      documentType: documentType,
    })

    return NextResponse.json({ document }, { status: 201 })
  } catch (error) {
    console.error('Erreur upload:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
