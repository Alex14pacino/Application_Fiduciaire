'use client'

import { FileImage, Trash2, ExternalLink, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'
import type { Document } from '@/lib/types/database'

interface DocumentCardProps {
  document: Document
  imageUrl?: string
  onDelete?: (id: string) => void
  onView?: (id: string) => void
  isDeleting?: boolean
  selectable?: boolean
  isSelected?: boolean
  onSelect?: (id: string) => void
}

/**
 * Carte d'affichage d'un document
 */
export function DocumentCard({
  document,
  imageUrl,
  onDelete,
  onView,
  isDeleting,
  selectable = false,
  isSelected = false,
  onSelect,
}: DocumentCardProps) {
  const isImage = document.mime_type.startsWith('image/')
  const formattedDate = new Date(document.created_at).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const handleClick = () => {
    if (selectable && onSelect) {
      onSelect(document.id)
    } else {
      onView?.(document.id)
    }
  }

  return (
    <Card className={cn(
      "overflow-hidden transition-all",
      isSelected && "ring-2 ring-blue-500 ring-offset-2"
    )}>
      {/* Aperçu du document */}
      <div
        className="relative h-40 cursor-pointer bg-slate-100"
        onClick={handleClick}
      >
        {isImage && imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={document.file_name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <FileImage className="h-12 w-12 text-slate-400" />
          </div>
        )}

        {/* Checkbox de sélection */}
        {selectable && (
          <div className={cn(
            "absolute top-2 left-2 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors",
            isSelected
              ? "bg-blue-500 border-blue-500"
              : "bg-white/80 border-slate-300 hover:border-blue-400"
          )}>
            {isSelected && <Check className="h-4 w-4 text-white" />}
          </div>
        )}

        {/* Overlay au hover (seulement si pas en mode sélection) */}
        {!selectable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100">
            <ExternalLink className="h-8 w-8 text-white" />
          </div>
        )}
      </div>

      {/* Informations */}
      <div className="p-3">
        <p className="truncate text-sm font-medium" title={document.file_name}>
          {document.file_name}
        </p>
        <p className="text-xs text-slate-500">{formattedDate}</p>

        {/* Actions */}
        {onDelete && (
          <div className="mt-2 flex justify-end">
            <Button
              onClick={() => onDelete(document.id)}
              variant="ghost"
              size="sm"
              disabled={isDeleting}
              className="text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
