'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, RefreshCw, CheckSquare, X, Download } from 'lucide-react'
import JSZip from 'jszip'
import { createClient } from '@/lib/supabase/client'
import { DocumentGrid } from '@/components/documents/document-grid'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type { Document, Profile } from '@/lib/types/database'

interface DocumentWithUrl extends Document {
  signedUrl?: string
}

interface ClientInfo {
  id: string
  profile: Profile
}

/**
 * Page listant les documents d'un client spécifique
 * Vue fiduciaire
 */
export default function ClientDocumentsPage() {
  const params = useParams()
  const clientId = params.clientId as string

  const [client, setClient] = useState<ClientInfo | null>(null)
  const [documents, setDocuments] = useState<DocumentWithUrl[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDownloading, setIsDownloading] = useState(false)

  /**
   * Charge les informations du client et ses documents
   */
  const loadData = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()

    // Charge les infos du client
    const { data: clientData } = await supabase
      .from('clients')
      .select(`
        id,
        profile:profiles(*)
      `)
      .eq('id', clientId)
      .single()

    if (clientData) {
      setClient(clientData as unknown as ClientInfo)
    }

    // Charge les documents
    const response = await fetch(`/api/documents?clientId=${clientId}`)
    const data = await response.json()

    if (response.ok) {
      setDocuments(data.documents || [])
    }

    setIsLoading(false)
  }, [clientId])

  /**
   * Ouvre un document dans un nouvel onglet
   */
  const handleView = async (documentId: string) => {
    const supabase = createClient()
    const doc = documents.find((d) => d.id === documentId)

    if (!doc) return

    const { data } = await supabase.storage
      .from('document-uploads')
      .createSignedUrl(doc.file_path, 3600)

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
    }
  }

  /**
   * Gère la sélection/désélection d'un document
   */
  const handleSelect = (documentId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(documentId)) {
        newSet.delete(documentId)
      } else {
        newSet.add(documentId)
      }
      return newSet
    })
  }

  /**
   * Active/désactive le mode sélection
   */
  const toggleSelectionMode = () => {
    setIsSelectionMode((prev) => !prev)
    setSelectedIds(new Set())
  }

  /**
   * Sélectionne ou désélectionne tous les documents
   */
  const toggleSelectAll = () => {
    if (selectedIds.size === documents.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(documents.map((doc) => doc.id)))
    }
  }

  /**
   * Télécharge les documents sélectionnés dans un fichier ZIP
   */
  const downloadSelected = async () => {
    if (selectedIds.size === 0) return

    setIsDownloading(true)
    const supabase = createClient()
    const selectedDocs = documents.filter((d) => selectedIds.has(d.id))
    const zip = new JSZip()

    try {
      // Télécharge chaque fichier et l'ajoute au ZIP
      for (const doc of selectedDocs) {
        const { data } = await supabase.storage
          .from('document-uploads')
          .createSignedUrl(doc.file_path, 3600)

        if (data?.signedUrl) {
          const response = await fetch(data.signedUrl)
          const blob = await response.blob()
          zip.file(doc.file_name, blob)
        }
      }

      // Génère le ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' })

      // Crée le nom du fichier ZIP avec le nom du client et la date
      const clientName = client?.profile?.full_name?.replace(/\s+/g, '_') || 'client'
      const date = new Date().toISOString().split('T')[0]
      const zipFileName = `${clientName}_documents_${date}.zip`

      // Télécharge le ZIP
      const url = window.URL.createObjectURL(zipBlob)
      const a = window.document.createElement('a')
      a.href = url
      a.download = zipFileName
      window.document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      window.document.body.removeChild(a)

    } catch (error) {
      console.error('Erreur téléchargement:', error)
      alert('Erreur lors du téléchargement')
    } finally {
      setIsDownloading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [loadData])

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center gap-4">
        <Link href="/fiduciary/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </Link>
      </div>

      {/* En-tête client */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <User className="h-6 w-6 text-slate-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {client?.profile?.full_name || 'Client'}
            </h1>
            <p className="text-slate-600">{client?.profile?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isSelectionMode ? (
            <>
              <Button onClick={toggleSelectionMode} variant="outline" size="sm">
                <CheckSquare className="mr-2 h-4 w-4" />
                Sélectionner
              </Button>
              <Button onClick={loadData} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualiser
              </Button>
            </>
          ) : (
            <>
              <Button onClick={toggleSelectAll} variant="outline" size="sm">
                {selectedIds.size === documents.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </Button>
              <Button
                onClick={downloadSelected}
                disabled={selectedIds.size === 0 || isDownloading}
                size="sm"
              >
                <Download className="mr-2 h-4 w-4" />
                {isDownloading
                  ? 'Téléchargement...'
                  : `Télécharger (${selectedIds.size})`}
              </Button>
              <Button onClick={toggleSelectionMode} variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Barre de sélection */}
      {isSelectionMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-700">
          {selectedIds.size === 0
            ? 'Cliquez sur les documents pour les sélectionner'
            : `${selectedIds.size} document${selectedIds.size > 1 ? 's' : ''} sélectionné${selectedIds.size > 1 ? 's' : ''}`}
        </div>
      )}

      {/* Liste des documents */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">
          Documents ({documents.length})
        </h2>
        <DocumentGrid
          documents={documents}
          onView={handleView}
          emptyMessage="Ce client n'a pas encore envoyé de documents"
          selectable={isSelectionMode}
          selectedIds={selectedIds}
          onSelect={handleSelect}
        />
      </div>
    </div>
  )
}
