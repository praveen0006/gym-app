import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch weight logs
    const { data: logs, error: logsError } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

    if (logsError) {
        return NextResponse.json({ error: logsError.message }, { status: 500 })
    }

    // Fetch active goal
    const { data: goal } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

    return NextResponse.json({
        logs,
        goal: goal || null
    })
}

export async function POST(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { type, ...payload } = body

    if (type === 'log_weight') {
        const { weight, date } = payload

        // Validate weight input
        if (typeof weight !== 'number' || isNaN(weight) || weight <= 0) {
            return NextResponse.json({ error: 'Invalid weight. Must be a positive number.' }, { status: 400 })
        }

        // Validate date format if provided
        if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD.' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('weight_logs')
            .upsert({
                user_id: user.id,
                weight,
                date: date || new Date().toISOString().split('T')[0],
                source: 'manual'
            }, { onConflict: 'user_id, date' })
            .select()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
    }

    if (type === 'set_goal') {
        const { start_weight, target_weight, target_date, start_date } = payload

        // Validate goal inputs
        if (typeof start_weight !== 'number' || isNaN(start_weight) || start_weight <= 0) {
            return NextResponse.json({ error: 'Invalid start_weight. Must be a positive number.' }, { status: 400 })
        }
        if (typeof target_weight !== 'number' || isNaN(target_weight) || target_weight <= 0) {
            return NextResponse.json({ error: 'Invalid target_weight. Must be a positive number.' }, { status: 400 })
        }
        if (target_date && !/^\d{4}-\d{2}-\d{2}$/.test(target_date)) {
            return NextResponse.json({ error: 'Invalid target_date format. Use YYYY-MM-DD.' }, { status: 400 })
        }
        if (start_date && !/^\d{4}-\d{2}-\d{2}$/.test(start_date)) {
            return NextResponse.json({ error: 'Invalid start_date format. Use YYYY-MM-DD.' }, { status: 400 })
        }
        if (start_weight === target_weight) {
            return NextResponse.json({ error: 'Start weight and target weight must be different.' }, { status: 400 })
        }

        // Deactivate old goals
        await supabase
            .from('user_goals')
            .update({ is_active: false })
            .eq('user_id', user.id)

        const { data, error } = await supabase
            .from('user_goals')
            .insert({
                user_id: user.id,
                start_weight,
                target_weight,
                target_date,
                start_date: start_date || new Date().toISOString().split('T')[0],
                is_active: true
            })
            .select()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}

export async function DELETE(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    const { error } = await supabase
        .from('weight_logs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
}
