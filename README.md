# FiduDocs - Application de Gestion Documentaire pour Fiduciaires

Application web permettant aux clients de fiduciaires d'envoyer facilement leurs justificatifs et reçus via leur smartphone, et aux fiduciaires de consulter ces documents.

## Fonctionnalités

### Pour les clients
- Inscription avec un ID fiduciaire fourni par leur comptable
- Capture de photos de justificatifs via la caméra du téléphone
- Upload de documents (JPG, PNG, PDF)
- Consultation de l'historique des documents envoyés
- Application mobile-first (PWA installable)

### Pour les fiduciaires
- Tableau de bord avec statistiques
- Liste de tous les clients liés
- Consultation des documents par client
- ID unique à partager avec les clients

## Stack technique

- **Framework** : Next.js 14 (App Router)
- **Langage** : TypeScript
- **Style** : Tailwind CSS
- **Base de données** : Supabase (PostgreSQL)
- **Authentification** : Supabase Auth
- **Stockage** : Supabase Storage

## Installation

### Prérequis

- Node.js 18+
- Compte Supabase (gratuit sur [supabase.com](https://supabase.com))

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd App_clients_fidu
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer Supabase

1. Créez un nouveau projet sur [Supabase](https://supabase.com)
2. Copiez le fichier `.env.example` vers `.env.local` :

```bash
cp .env.example .env.local
```

3. Remplissez les variables d'environnement avec vos clés Supabase :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Configurer la base de données

Exécutez les scripts SQL dans l'ordre dans le **SQL Editor** de Supabase :

1. `database/migrations/001_initial_schema.sql` - Crée les tables et fonctions
2. `database/migrations/002_rls_policies.sql` - Configure les politiques de sécurité
3. `database/migrations/003_storage_policies.sql` - Configure le stockage

### 5. Créer le bucket de stockage

Dans Supabase Dashboard > Storage :

1. Créez un nouveau bucket nommé `document-uploads`
2. Configurez-le comme **privé** (non public)
3. Limite de taille : 10 Mo
4. Types MIME autorisés : `image/jpeg`, `image/png`, `image/webp`, `application/pdf`

### 6. Créer un compte fiduciaire (manuellement)

Dans Supabase Dashboard > SQL Editor, exécutez :

```sql
-- 1. D'abord, inscrivez-vous via l'interface web (/signup) avec un email temporaire
-- Ou créez un utilisateur manuellement :

-- 2. Mettez à jour le profil pour le rôle fiduciaire
UPDATE public.profiles
SET role = 'fiduciary'
WHERE email = 'votre-email@exemple.com';

-- 3. Créez l'entrée fiduciaire
INSERT INTO public.fiduciaries (profile_id, fiduciary_id, company_name)
SELECT id, 'FID-ABC123', 'Nom de votre cabinet'
FROM public.profiles
WHERE email = 'votre-email@exemple.com';
```

### 7. Lancer l'application

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

## Structure du projet

```
src/
├── app/
│   ├── (auth)/              # Pages publiques (login, signup)
│   ├── (client)/            # Pages client (dashboard, capture, documents)
│   ├── (fiduciary)/         # Pages fiduciaire (dashboard, clients)
│   └── api/                 # Routes API
├── components/
│   ├── ui/                  # Composants de base (Button, Card, Input)
│   ├── auth/                # Formulaires d'authentification
│   ├── camera/              # Capture photo
│   ├── documents/           # Gestion documents
│   └── layout/              # Navigation et mise en page
├── lib/
│   ├── supabase/            # Clients Supabase
│   ├── types/               # Types TypeScript
│   ├── utils/               # Utilitaires
│   └── validations/         # Schémas Zod
└── database/
    └── migrations/          # Scripts SQL
```

## Utilisation

### Créer un client

1. Le fiduciaire partage son **ID fiduciaire** (ex: `FID-ABC123`) avec son client
2. Le client s'inscrit sur `/signup` avec cet ID
3. Après confirmation email, le client peut se connecter

### Envoyer un document

1. Le client se connecte
2. Clique sur "Capturer" ou "Ouvrir la caméra"
3. Prend une photo ou sélectionne un fichier
4. Le document est envoyé et visible par le fiduciaire

### Consulter les documents (fiduciaire)

1. Le fiduciaire se connecte
2. Accède à "Clients" pour voir la liste
3. Clique sur un client pour voir ses documents

## Déploiement

### Vercel (recommandé)

1. Connectez votre repo GitHub à Vercel
2. Configurez les variables d'environnement
3. Déployez

### Autres plateformes

L'application peut être déployée sur n'importe quelle plateforme supportant Next.js :
- Railway
- Render
- DigitalOcean App Platform

## Licence

Projet privé - Tous droits réservés
