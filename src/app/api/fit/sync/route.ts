import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        console.error("Sync failed: No user logged in")
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // 1. Get Access Token
        const { data: integration, error: dbError } = await supabase
            .from('integrations')
            .select('access_token, refresh_token, expires_at')
            .eq('user_id', user.id)
            .eq('provider', 'google_fit')
            .maybeSingle()

        if (dbError) {
            console.error("Sync failed: Database error", dbError)
            return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }

        if (!integration) {
            console.warn("Sync failed: No integration found for user", user.id)
            return NextResponse.json({ error: 'Google Fit not connected' }, { status: 400 })
        }

        let accessToken = integration.access_token

        // 2. Check Expiry & Refresh if needed
        const expiresAt = new Date(integration.expires_at).getTime()
        // Refresh if expired or expiring in less than 5 minutes
        if (Date.now() > expiresAt - 5 * 60 * 1000) {
            if (!integration.refresh_token) {
                console.error("Token expired and no refresh token available", user.id)
                return NextResponse.json({ error: 'Token expired and no refresh token available. Please reconnect.' }, { status: 401 })
            }

            console.log("Refreshing Google Token for user", user.id)
            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: process.env.GOOGLE_CLIENT_ID!,
                    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                    refresh_token: integration.refresh_token,
                    grant_type: 'refresh_token',
                }),
            })

            const tokens = await tokenResponse.json()

            if (!tokenResponse.ok) {
                console.error("Token refresh failed", tokens)
                return NextResponse.json({ error: 'Failed to refresh token' }, { status: 401 })
            }

            accessToken = tokens.access_token
            // Update DB with new token
            await supabase.from('integrations').update({
                access_token: tokens.access_token,
                expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
            }).eq('user_id', user.id).eq('provider', 'google_fit')
        }

        // 3. Fetch Data from Google Fit (Last 30 Days)
        const midnightUTC = new Date()
        midnightUTC.setUTCHours(0, 0, 0, 0)
        const endTime = Date.now()
        // Go back 30 days from midnight
        const startTime = midnightUTC.getTime() - 30 * 24 * 60 * 60 * 1000

        // debug log
        // console.log(`Fetching from ${new Date(startTime).toISOString()} to ${new Date(endTime).toISOString()}`)

        const fitResponse = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                aggregateBy: [
                    { dataTypeName: 'com.google.step_count.delta' },
                    { dataTypeName: 'com.google.calories.expended' },
                    { dataTypeName: 'com.google.active_minutes' },
                    { dataTypeName: 'com.google.heart_minutes' },
                    { dataTypeName: 'com.google.weight' }
                ],
                bucketByTime: { durationMillis: 86400000 }, // 1 day
                startTimeMillis: startTime,
                endTimeMillis: endTime,
            }),
        })

        const fitData = await fitResponse.json()

        if (!fitResponse.ok) {
            console.error("Fit API Error", fitData)
            return NextResponse.json({ error: 'Error fetching from Google Fit' }, { status: 500 })
        }

        // 4. Transform & Save to DB
        const activityUpdates: Array<{
            user_id: string;
            date: string;
            steps: number;
            calories: number;
            active_minutes: number;
            heart_minutes: number;
        }> = []
        const weightUpdates: Array<{
            user_id: string;
            weight: number;
            date: string;
            source: string;
        }> = []

        // Type guard for Google Fit API response
        if (!fitData.bucket || !Array.isArray(fitData.bucket)) {
            console.error("Invalid Fit API response structure");
            return NextResponse.json({ error: 'Invalid data format from Google Fit' }, { status: 500 });
        }

        for (const bucket of fitData.bucket) {
            if (!bucket.startTimeMillis || !bucket.dataset) {
                continue; // Skip invalid buckets
            }

            const date = new Date(parseInt(bucket.startTimeMillis)).toISOString().split('T')[0]

            let steps = 0
            let calories = 0
            let activeMinutes = 0
            let heartMinutes = 0
            let weight = 0

            // Parse Datasets
            if (Array.isArray(bucket.dataset)) {
                bucket.dataset.forEach((ds: { dataSourceId?: string; point?: Array<{ value?: Array<{ fpVal?: number; intVal?: number }> }> }) => {
                    const dataSourceId = ds.dataSourceId;
                    if (!dataSourceId || !ds.point || !Array.isArray(ds.point)) {
                        return;
                    }

                    ds.point.forEach((p) => {
                        if (!p.value || !Array.isArray(p.value) || p.value.length === 0) {
                            return;
                        }

                        // Prioritize fpVal (float) over intVal if both exist
                        const val = p.value[0].fpVal !== undefined ? p.value[0].fpVal : (p.value[0].intVal !== undefined ? p.value[0].intVal : 0);

                        if (dataSourceId.includes('step_count')) {
                            steps += val
                        } else if (dataSourceId.includes('calories')) {
                            calories += val;
                        } else if (dataSourceId.includes('heart_minutes')) {
                            heartMinutes += val;
                        } else if (dataSourceId.includes('active_minutes') || dataSourceId.includes('minutes')) {
                            activeMinutes += val
                        } else if (dataSourceId.includes('weight')) {
                            weight = val; // Weight is usually an absolute value at that point in time
                        }
                    })
                })
            }

            if (steps > 0 || calories > 0 || activeMinutes > 0 || heartMinutes > 0) {
                activityUpdates.push({
                    user_id: user.id,
                    date: date,
                    steps: steps,
                    calories: calories,
                    active_minutes: activeMinutes,
                    heart_minutes: heartMinutes
                })
            }

            if (weight > 0) {
                weightUpdates.push({
                    user_id: user.id,
                    weight: weight,
                    date: date,
                    source: 'google_fit'
                })
            }
        }

        // Save Activity
        if (activityUpdates.length > 0) {
            const { error: upsertError } = await supabase
                .from('daily_activity')
                .upsert(activityUpdates, { onConflict: 'user_id, date' })

            if (upsertError) {
                console.error("Activity DB Upsert Error", upsertError)
                return NextResponse.json({ error: 'Failed to save activity data', details: upsertError.message }, { status: 500 })
            }
        }

        // Save Weight Logs
        if (weightUpdates.length > 0) {
            // For weight, we also avoid duplicates per day/user from google_fit
            // Using upsert with onConflict to handle duplicates
            const { error: weightError } = await supabase
                .from('weight_logs')
                .upsert(weightUpdates, { onConflict: 'user_id, date' })

            if (weightError) {
                console.error("Weight DB Upsert Error", weightError)
                return NextResponse.json({ error: 'Failed to save weight data', details: weightError.message }, { status: 500 })
            }
        }

        return NextResponse.json({
            success: true,
            activityCount: activityUpdates.length,
            weightCount: weightUpdates.length
        })

    } catch (e: any) {
        console.error("Sync Logic Error", e)
        return NextResponse.json({ error: e.message || 'Sync failed' }, { status: 500 })
    }
}

