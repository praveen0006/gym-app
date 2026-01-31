import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || origin
            console.log('Redirecting to:', `${baseUrl}${next}`)
            return NextResponse.redirect(`${baseUrl}${next}`)
        }
        console.error('Supabase Auth Code Exchange Error:', error)
        console.error('Code used:', code)
        console.error('Origin:', origin)
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
