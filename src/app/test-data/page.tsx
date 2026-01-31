import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function TestDataPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    // Fetch all activity data
    const { data: activity, error } = await supabase
        .from('daily_activity')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

    return (
        <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
            <h1>Raw Data Test Route</h1>
            <p>User: {user.email}</p>

            {error && (
                <div style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', margin: '1rem 0' }}>
                    Error fetching data: {error.message}
                </div>
            )}

            <h2>Daily Activity Records ({activity?.length || 0})</h2>

            <pre style={{
                background: '#f1f5f9',
                padding: '1rem',
                borderRadius: '8px',
                overflowX: 'auto',
                fontSize: '0.9rem'
            }}>
                {JSON.stringify(activity, null, 2)}
            </pre>

            <div style={{ marginTop: '2rem' }}>
                <a href="/dashboard" style={{ color: 'blue', textDecoration: 'underline' }}>Back to Dashboard</a>
            </div>
        </div>
    )
}
