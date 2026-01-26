-- ===========================================
-- POLITIQUES RLS (Row Level Security)
-- À exécuter après 001_initial_schema.sql
-- ===========================================

-- Active RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiduciaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- POLITIQUES PROFILES
-- ===========================================

-- Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Les fiduciaires peuvent voir les profils de leurs clients
CREATE POLICY "Fiduciaries can view client profiles"
    ON public.profiles
    FOR SELECT
    USING (
        public.is_fiduciary(auth.uid())
        AND EXISTS (
            SELECT 1 FROM public.clients c
            JOIN public.fiduciaries f ON f.id = c.fiduciary_id
            WHERE c.profile_id = profiles.id
            AND f.profile_id = auth.uid()
        )
    );

-- ===========================================
-- POLITIQUES FIDUCIARIES
-- ===========================================

-- Les fiduciaires peuvent voir leur propre enregistrement
CREATE POLICY "Fiduciaries can view own record"
    ON public.fiduciaries
    FOR SELECT
    USING (profile_id = auth.uid());

-- Les fiduciaires peuvent modifier leur propre enregistrement
CREATE POLICY "Fiduciaries can update own record"
    ON public.fiduciaries
    FOR UPDATE
    USING (profile_id = auth.uid());

-- Tout le monde peut vérifier si un fiduciary_id existe (pour l'inscription)
-- Note: L'API ne retourne que le résultat booléen, pas les données complètes
CREATE POLICY "Anyone can validate fiduciary_id"
    ON public.fiduciaries
    FOR SELECT
    USING (true);

-- ===========================================
-- POLITIQUES CLIENTS
-- ===========================================

-- Les clients peuvent voir leur propre enregistrement
CREATE POLICY "Clients can view own record"
    ON public.clients
    FOR SELECT
    USING (profile_id = auth.uid());

-- Les clients peuvent modifier leur propre enregistrement
CREATE POLICY "Clients can update own record"
    ON public.clients
    FOR UPDATE
    USING (profile_id = auth.uid());

-- Les fiduciaires peuvent voir leurs clients liés
CREATE POLICY "Fiduciaries can view their clients"
    ON public.clients
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.fiduciaries f
            WHERE f.id = clients.fiduciary_id
            AND f.profile_id = auth.uid()
        )
    );

-- Les fiduciaires peuvent modifier les notes de leurs clients
CREATE POLICY "Fiduciaries can update client notes"
    ON public.clients
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.fiduciaries f
            WHERE f.id = clients.fiduciary_id
            AND f.profile_id = auth.uid()
        )
    );

-- ===========================================
-- POLITIQUES DOCUMENTS
-- ===========================================

-- Les clients peuvent voir leurs propres documents
CREATE POLICY "Clients can view own documents"
    ON public.documents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.clients c
            WHERE c.id = documents.client_id
            AND c.profile_id = auth.uid()
        )
    );

-- Les clients peuvent créer leurs propres documents
CREATE POLICY "Clients can insert own documents"
    ON public.documents
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.clients c
            WHERE c.id = documents.client_id
            AND c.profile_id = auth.uid()
        )
    );

-- Les clients peuvent modifier leurs propres documents
CREATE POLICY "Clients can update own documents"
    ON public.documents
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.clients c
            WHERE c.id = documents.client_id
            AND c.profile_id = auth.uid()
        )
    );

-- Les clients peuvent supprimer leurs propres documents
CREATE POLICY "Clients can delete own documents"
    ON public.documents
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.clients c
            WHERE c.id = documents.client_id
            AND c.profile_id = auth.uid()
        )
    );

-- Les fiduciaires peuvent voir les documents de leurs clients
CREATE POLICY "Fiduciaries can view client documents"
    ON public.documents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.clients c
            JOIN public.fiduciaries f ON f.id = c.fiduciary_id
            WHERE c.id = documents.client_id
            AND f.profile_id = auth.uid()
        )
    );
