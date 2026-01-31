import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId) {
        return new Response('Missing GOOGLE_CLIENT_ID', { status: 500 })
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/fit/callback`
    const scopes = [
        'https://www.googleapis.com/auth/fitness.activity.read',
        'https://www.googleapis.com/auth/fitness.body.read',
        'https://www.googleapis.com/auth/fitness.heart_rate.read',
    ].join(' ')

    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', scopes)
    url.searchParams.set('access_type', 'offline')
    url.searchParams.set('prompt', 'consent') // Force refresh token

    // State parameter to prevent CSRF, but for now we rely on the session being present
    // Ideally, sign the state with the user session

    return redirect(url.toString())
}
