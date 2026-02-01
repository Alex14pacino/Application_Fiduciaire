import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function ClientLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4 text-slate-600" />
        <p className="text-sm text-slate-500">Chargement...</p>
      </div>
    </div>
  )
}
