'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

export async function signInWithGoogle() {
    const supabase = await createClient()
    const origin = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${origin}/auth/callback`,
        },
    })

    if (error) {
        console.error(error) // Handle error appropriately
        return redirect('/login?message=Could not authenticate user')
    }

    if (data.url) {
        return redirect(data.url)
    }
}
