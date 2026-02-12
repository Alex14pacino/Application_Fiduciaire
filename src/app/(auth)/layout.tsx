import { InstallRedirect } from '@/components/pwa/install-redirect'

/**
 * Layout pour les pages d'authentification (login, signup)
 * Redirige vers /install si l'app n'est pas installée sur mobile
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <InstallRedirect>
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </InstallRedirect>
  )
}
