import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { SignupForm } from '@/components/auth/signup-form'

export const metadata = {
  title: 'Créer un compte - FiduDocs',
  description: 'Créez votre compte client FiduDocs',
}

/**
 * Page d'inscription pour les clients
 */
export default function SignupPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Créer un compte</CardTitle>
        <CardDescription>
          Inscrivez-vous pour envoyer vos documents à votre fiduciaire
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm />
      </CardContent>
    </Card>
  )
}
