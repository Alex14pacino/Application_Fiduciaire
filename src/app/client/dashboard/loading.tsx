import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 px-4">
      <LoadingSpinner size="lg" className="text-slate-600" />
      <p className="text-sm text-slate-500">Chargement...</p>
    </div>
  )
}
