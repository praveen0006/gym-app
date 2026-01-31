import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// GET is handled by seed/route.ts data already, but adding it here for completeness
export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
        .from('workout_schedules')
        .select(`*, scheduled_exercises (*)`)
        .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data)
}

// PUT - Update a schedule
export async function PUT(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { id, name, notes, exercises } = body

        if (!id) return NextResponse.json({ error: 'Missing schedule ID' }, { status: 400 })

        // 1. Update schedule
        const { error: schError } = await supabase
            .from('workout_schedules')
            .update({ name, notes })
            .eq('id', id)
            .eq('user_id', user.id)

        if (schError) throw schError

        // 2. Replace exercises (delete and re-insert)
        const { error: delError } = await supabase
            .from('scheduled_exercises')
            .delete()
            .eq('schedule_id', id)

        if (delError) throw delError

        if (exercises && exercises.length > 0) {
            const rows = exercises.map((ex: any) => ({
                schedule_id: id,
                exercise_name: ex.exercise_name,
                target_sets: ex.target_sets,
                target_reps_min: ex.target_reps_min,
                target_reps_max: ex.target_reps_max,
                notes: ex.notes
            }))

            const { error: insError } = await supabase
                .from('scheduled_exercises')
                .insert(rows)

            if (insError) throw insError
        }

        return NextResponse.json({ success: true })

    } catch (e: any) {
        console.error('Schedule PUT error:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

// DELETE - Remove a schedule and its exercises (cascade)
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
        .from('workout_schedules')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
}
