-- ===========================================
-- SCHEMA INITIAL - Application Fiduciaire
-- À exécuter dans Supabase SQL Editor
-- ===========================================

-- Active l'extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- TYPES ENUM
-- ===========================================

-- Rôles utilisateur
CREATE TYPE user_role AS ENUM ('fiduciary', 'client');

-- ===========================================
-- TABLE PROFILES
-- Extension de auth.users pour stocker les infos utilisateur
-- ===========================================

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role user_role NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index pour les requêtes par rôle
CREATE INDEX idx_profiles_role ON public.profiles(role);

COMMENT ON TABLE public.profiles IS 'Profils utilisateurs liés à auth.users';
COMMENT ON COLUMN public.profiles.role IS 'Rôle: fiduciary ou client';

-- ===========================================
-- TABLE FIDUCIARIES
-- Comptes des fiduciaires
-- ===========================================

CREATE TABLE public.fiduciaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    fiduciary_id TEXT NOT NULL UNIQUE, -- ID lisible (ex: "FID-ABC123")
    company_name TEXT,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index pour la validation du fiduciary_id lors de l'inscription client
CREATE UNIQUE INDEX idx_fiduciaries_fiduciary_id ON public.fiduciaries(fiduciary_id);

COMMENT ON TABLE public.fiduciaries IS 'Comptes fiduciaires créés manuellement';
COMMENT ON COLUMN public.fiduciaries.fiduciary_id IS 'ID unique à partager avec les clients pour l inscription';

-- ===========================================
-- TABLE CLIENTS
-- Clients liés à un fiduciaire
-- ===========================================

CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    fiduciary_id UUID NOT NULL REFERENCES public.fiduciaries(id) ON DELETE RESTRICT,
    client_reference TEXT, -- Référence interne optionnelle
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index pour lister les clients d'un fiduciaire
CREATE INDEX idx_clients_fiduciary_id ON public.clients(fiduciary_id);

COMMENT ON TABLE public.clients IS 'Clients des fiduciaires';
COMMENT ON COLUMN public.clients.fiduciary_id IS 'Référence vers le fiduciaire lié';

-- ===========================================
-- TABLE DOCUMENTS
-- Photos et documents uploadés
-- ===========================================

CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,

    -- Informations fichier
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Chemin dans Supabase Storage
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,

    -- Métadonnées
    title TEXT,
    description TEXT,

    -- Horodatage
    captured_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_documents_client_id ON public.documents(client_id);
CREATE INDEX idx_documents_created_at ON public.documents(created_at DESC);

COMMENT ON TABLE public.documents IS 'Documents et photos uploadés par les clients';

-- ===========================================
-- FONCTIONS HELPER
-- ===========================================

-- Vérifie si un utilisateur est fiduciaire
CREATE OR REPLACE FUNCTION public.is_fiduciary(user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role = 'fiduciary'
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Récupère le fiduciary_id d'un client
CREATE OR REPLACE FUNCTION public.get_client_fiduciary_uuid(user_id UUID)
RETURNS UUID AS $$
    SELECT c.fiduciary_id
    FROM public.clients c
    WHERE c.profile_id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ===========================================
-- TRIGGER: Mise à jour automatique de updated_at
-- ===========================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_fiduciaries_updated_at
    BEFORE UPDATE ON public.fiduciaries
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===========================================
-- TRIGGER: Création automatique du profil et client
-- Exécuté après l'inscription via Supabase Auth
-- ===========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_user_role user_role;
    v_fiduciary_uuid UUID;
BEGIN
    -- Récupère le rôle depuis les metadata (défini lors de l'inscription)
    v_user_role := COALESCE(
        (NEW.raw_user_meta_data->>'role')::user_role,
        'client'
    );

    -- Crée le profil
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        v_user_role
    );

    -- Si c'est un client, crée l'entrée dans la table clients
    IF v_user_role = 'client' THEN
        -- Récupère l'UUID du fiduciaire depuis le fiduciary_id fourni
        SELECT id INTO v_fiduciary_uuid
        FROM public.fiduciaries
        WHERE fiduciary_id = NEW.raw_user_meta_data->>'fiduciary_id'
        AND is_active = true;

        IF v_fiduciary_uuid IS NOT NULL THEN
            INSERT INTO public.clients (profile_id, fiduciary_id)
            VALUES (NEW.id, v_fiduciary_uuid);
        ELSE
            -- Ne devrait pas arriver si la validation fonctionne
            RAISE EXCEPTION 'fiduciary_id invalide fourni';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger déclenché après création d'un utilisateur
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
