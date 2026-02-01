import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function CaptureLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <LoadingSpinner size="lg" className="text-slate-600" />
      <p className="mt-4 text-sm text-slate-500">Chargement...</p>
    </div>
  )
}
