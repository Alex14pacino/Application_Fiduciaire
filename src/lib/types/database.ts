/**
 * Types TypeScript pour la base de données Supabase
 * Correspond au schéma défini dans les migrations SQL
 */

export type UserRole = 'fiduciary' | 'client'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  avatar_url: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export interface Fiduciary {
  id: string
  profile_id: string
  fiduciary_id: string // ID lisible (ex: "FID-ABC123")
  company_name: string | null
  address: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  profile_id: string
  fiduciary_id: string // UUID du fiduciaire
  client_reference: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  client_id: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  title: string | null
  description: string | null
  captured_at: string
  created_at: string
  updated_at: string
}

// Types avec relations
export interface ClientWithProfile extends Client {
  profile: Profile
}

export interface DocumentWithClient extends Document {
  client: ClientWithProfile
}

export interface FiduciaryWithProfile extends Fiduciary {
  profile: Profile
}

// Types pour les formulaires
export interface SignupFormData {
  email: string
  password: string
  fullName: string
  fiduciaryId: string
}

export interface LoginFormData {
  email: string
  password: string
}

// Type pour la base de données Supabase
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      fiduciaries: {
        Row: Fiduciary
        Insert: Omit<Fiduciary, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Fiduciary, 'id' | 'created_at' | 'updated_at'>>
      }
      clients: {
        Row: Client
        Insert: Omit<Client, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>>
      }
      documents: {
        Row: Document
        Insert: Omit<Document, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Document, 'id' | 'created_at' | 'updated_at'>>
      }
    }
    Enums: {
      user_role: UserRole
    }
  }
}
