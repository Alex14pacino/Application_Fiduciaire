import { Suspense } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LoginForm } from '@/components/auth/login-form'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export const metadata = {
  title: 'Connexion - FiduDocs',
  description: 'Connectez-vous à votre compte FiduDocs',
}

/**
 * Page de connexion
 */
export default function LoginPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Connexion</CardTitle>
        <CardDescription>
          Connectez-vous à votre compte FiduDocs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense
          fallback={
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </CardContent>
    </Card>
  )
}
