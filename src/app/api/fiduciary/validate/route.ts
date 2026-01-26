import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Valide qu'un fiduciary_id existe dans la base de données
 * Utilisé lors de l'inscription d'un nouveau client
 * Utilise le client admin pour bypasser les RLS
 */
export async function POST(request: NextRequest) {
  try {
    const { fiduciary_id } = await request.json()

    if (!fiduciary_id) {
      return NextResponse.json(
        { valid: false, error: 'L\'ID du fiduciaire est requis' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Recherche le fiduciaire par son ID lisible
    const { data, error } = await supabase
      .from('fiduciaries')
      .select('id, company_name')
      .eq('fiduciary_id', fiduciary_id)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { valid: false, error: 'ID fiduciaire invalide' },
        { status: 404 }
      )
    }

    // Retourne uniquement les infos nécessaires
    return NextResponse.json({
      valid: true,
      fiduciary: { company_name: data.company_name },
    })
  } catch {
    return NextResponse.json(
      { valid: false, error: 'Erreur de validation' },
      { status: 500 }
    )
  }
}
