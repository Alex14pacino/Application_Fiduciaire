'use client'

import { useState } from 'react'
import { FileX, ChevronDown, ChevronRight } from 'lucide-react'
import { DocumentCard } from './document-card'
import type { Document } from '@/lib/types/database'

interface DocumentWithUrl extends Document {
  signedUrl?: string
}

interface DocumentGridProps {
  documents: DocumentWithUrl[]
  onDelete?: (id: string) => void
  onView?: (id: string) => void
  deletingId?: string | null
  emptyMessage?: string
  selectable?: boolean
  selectedIds?: Set<string>
  onSelect?: (id: string) => void
}

/**
 * Formate une date en nom de mois et année en français
 */
function formatMonthYear(dateString: string): string {
  const date = new Date(dateString)
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]
  return `${months[date.getMonth()]} ${date.getFullYear()}`
}

/**
 * Génère une clé unique pour le mois (YYYY-MM)
 */
function getMonthKey(dateString: string): string {
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Groupe les documents par mois et les trie du plus récent au plus ancien
 */
function groupDocumentsByMonth(documents: DocumentWithUrl[]): Map<string, DocumentWithUrl[]> {
  // Trie d'abord tous les documents par date décroissante
  const sortedDocs = [...documents].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  // Groupe par mois
  const grouped = new Map<string, DocumentWithUrl[]>()

  for (const doc of sortedDocs) {
    const monthKey = getMonthKey(doc.created_at)
    if (!grouped.has(monthKey)) {
      grouped.set(monthKey, [])
    }
    grouped.get(monthKey)!.push(doc)
  }

  return grouped
}

/**
 * Grille d'affichage des documents groupés par mois
 */
export function DocumentGrid({
  documents,
  onDelete,
  onView,
  deletingId,
  emptyMessage = 'Aucun document',
  selectable = false,
  selectedIds = new Set(),
  onSelect,
}: DocumentGridProps) {
  const groupedDocuments = groupDocumentsByMonth(documents)
  const monthKeys = Array.from(groupedDocuments.keys())

  // Par défaut, seul le mois le plus récent est déplié
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(
    new Set(monthKeys.length > 0 ? [monthKeys[0]] : [])
  )

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(monthKey)) {
        newSet.delete(monthKey)
      } else {
        newSet.add(monthKey)
      }
      return newSet
    })
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileX className="mb-4 h-16 w-16 text-slate-300" />
        <p className="text-slate-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {Array.from(groupedDocuments.entries()).map(([monthKey, monthDocs]) => {
        const isExpanded = expandedMonths.has(monthKey)

        return (
          <div key={monthKey} className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleMonth(monthKey)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-slate-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-slate-500" />
                )}
                <span className="font-semibold text-slate-700">
                  {formatMonthYear(monthDocs[0].created_at)}
                </span>
              </div>
              <span className="text-sm text-slate-500">
                {monthDocs.length} document{monthDocs.length > 1 ? 's' : ''}
              </span>
            </button>

            {isExpanded && (
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {monthDocs.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      imageUrl={doc.signedUrl}
                      onDelete={onDelete}
                      onView={onView}
                      isDeleting={deletingId === doc.id}
                      selectable={selectable}
                      isSelected={selectedIds.has(doc.id)}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
