import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Ops, algo deu errado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {params?.error ? `Código: ${params.error}` : "Ocorreu um erro não especificado."}
            </p>
            <Button asChild className="w-full">
              <Link href="/auth/login">Tentar novamente</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
