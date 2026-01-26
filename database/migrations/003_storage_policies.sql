-- ===========================================
-- CONFIGURATION STORAGE SUPABASE
-- À exécuter dans Supabase Dashboard > Storage
-- ===========================================

-- Note: Ces commandes sont à exécuter via l'interface Supabase
-- car la création de buckets n'est pas supportée via SQL standard

-- 1. Créer le bucket "document-uploads" dans Storage
-- Dashboard > Storage > New bucket
-- Name: document-uploads
-- Public: false
-- File size limit: 10MB
-- Allowed MIME types: image/jpeg, image/png, image/webp, application/pdf

-- ===========================================
-- POLITIQUES STORAGE (via SQL Editor)
-- ===========================================

-- Permet aux clients d'uploader dans leur propre dossier
CREATE POLICY "Clients can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'document-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permet aux clients de lire leurs propres fichiers
CREATE POLICY "Clients can read own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'document-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permet aux clients de supprimer leurs propres fichiers
CREATE POLICY "Clients can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'document-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permet aux fiduciaires de lire les fichiers de leurs clients
CREATE POLICY "Fiduciaries can read client files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'document-uploads'
    AND EXISTS (
        SELECT 1 FROM public.clients c
        JOIN public.fiduciaries f ON f.id = c.fiduciary_id
        WHERE (storage.foldername(name))[1] = c.profile_id::text
        AND f.profile_id = auth.uid()
    )
);
