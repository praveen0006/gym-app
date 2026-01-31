import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
        return NextResponse.json({ error }, { status: 400 })
    }

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/fit/callback`

    if (!clientId || !clientSecret) {
        return NextResponse.json({ error: 'Missing Google credentials' }, { status: 500 })
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
        }),
    })

    const tokens = await tokenResponse.json()

    if (!tokenResponse.ok) {
        return NextResponse.json(tokens, { status: 400 })
    }

    // Save tokens to DB
    const { error: dbError } = await supabase
        .from('integrations')
        .upsert({
            user_id: user.id,
            provider: 'google_fit',
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token, // IMPORTANT: Might be undefined if not prompt=consent
            expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id, provider' })

    if (dbError) {
        return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return redirect('/dashboard?fit_connected=true')
}
