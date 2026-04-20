import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { TanqiWordmark } from "@/components/tanqi-logo"

const ERROR_MESSAGES: Record<string, string> = {
  otp_expired: "O link de acesso expirou. Solicite um novo link e tente novamente.",
  otp_disabled: "Login por link não está habilitado. Use email e senha.",
  unauthorized_client: "Acesso não autorizado. Verifique se o link é válido.",
  access_denied: "Acesso negado. Por favor, tente fazer login novamente.",
  invalid_request: "Solicitação inválida. Tente novamente a partir do início.",
}

function friendlyMessage(code: string | undefined): string {
  if (!code) return "Ocorreu um erro inesperado. Tente novamente."
  return ERROR_MESSAGES[code] ?? "Ocorreu um erro ao processar seu acesso. Tente novamente."
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <TanqiWordmark size="lg" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Algo deu errado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{friendlyMessage(params?.error)}</p>
            <Button asChild className="w-full">
              <Link href="/auth/login">Tentar novamente</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
