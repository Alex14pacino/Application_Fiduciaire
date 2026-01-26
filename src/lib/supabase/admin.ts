import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase avec privilèges admin (service role)
 * À utiliser uniquement côté serveur pour les opérations privilégiées
 * Ne JAMAIS exposer ce client au navigateur
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
