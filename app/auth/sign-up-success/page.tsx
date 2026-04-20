import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { TanqiWordmark } from "@/components/tanqi-logo"
import { MailCheck } from "lucide-react"

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <TanqiWordmark size="lg" />
        </div>
        <Card>
          <CardHeader className="items-center text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20">
              <MailCheck className="size-6" />
            </div>
            <CardTitle className="text-2xl">Confirme seu email</CardTitle>
            <CardDescription>Enviamos um link para validar sua conta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Clique no link do email para ativar sua conta e começar a usar o Tanqi.
            </p>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/auth/login">Voltar para o login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
