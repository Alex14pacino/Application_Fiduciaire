import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function DocumentsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-4 w-24 animate-pulse rounded bg-slate-200" />
        </div>
      </div>
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" className="text-slate-600" />
      </div>
    </div>
  )
}
