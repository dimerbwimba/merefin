import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Créer un compte</h1>
        <RegisterForm />
      </div>
    </div>
  )
}
