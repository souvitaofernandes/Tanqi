import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

function safeRedirectPath(raw: string | null): string {
  if (!raw) return "/dashboard"
  // Must be a relative path: starts with /, not // (protocol-relative) or /\
  if (raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\")) {
    return raw
  }
  return "/dashboard"
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const next = safeRedirectPath(searchParams.get("next"))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
