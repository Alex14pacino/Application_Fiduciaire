'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DocumentGrid } from '@/components/documents/document-grid'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type { Document } from '@/lib/types/database'

interface DocumentWithUrl extends Document {
  signedUrl?: string
}

/**
 * Page listant tous les documents du client
 */
export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentWithUrl[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  /**
   * Charge les documents depuis l'API
   */
  const loadDocuments = useCallback(async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/documents')
      const data = await response.json()

      if (response.ok) {
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Erreur chargement documents:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Supprime un document
   */
  const handleDelete = async (documentId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce document ?')) {
      return
    }

    setDeletingId(documentId)

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentId))
      } else {
        alert('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur suppression:', error)
      alert('Erreur lors de la suppression')
    } finally {
      setDeletingId(null)
    }
  }

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

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mes documents</h1>
          <p className="text-slate-600">
            {documents.length} document{documents.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={loadDocuments} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <DocumentGrid
          documents={documents}
          onDelete={handleDelete}
          onView={handleView}
          deletingId={deletingId}
          emptyMessage="Vous n'avez pas encore envoyé de documents"
        />
      )}
    </div>
  )
}
