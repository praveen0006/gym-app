import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: workouts, error } = await supabase
        .from('workouts')
        .select(`
            *,
            workout_exercises (*)
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(workouts)
}

export async function POST(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { date, name, duration_minutes, rating, exercises, schedule_id } = body

        // 1. Create Workout Log
        const { data: workout, error: wError } = await supabase
            .from('workouts')
            .insert({
                user_id: user.id,
                date: date || new Date().toISOString().split('T')[0],
                name: name || 'Untitled Workout',
                duration_minutes,
                rating,
                schedule_id
            })
            .select()
            .single()

        if (wError) throw wError

        // 2. Create Exercises
        if (exercises && exercises.length > 0) {
            const exerciseRows = exercises.map((ex: any) => ({
                workout_id: workout.id,
                exercise_name: ex.exercise_name,
                sets_completed: ex.sets_completed,
                reps_completed: ex.reps_completed,
                weight_kg: ex.weight_kg,
                notes: ex.notes
            }))

            const { error: exError } = await supabase
                .from('workout_exercises')
                .insert(exerciseRows)

            if (exError) throw exError
        }

        return NextResponse.json(workout)

    } catch (e: any) {
        console.error(e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function PUT(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { id, name, duration_minutes, rating, exercises } = body

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

        // 1. Update Workout Log
        const { error: wError } = await supabase
            .from('workouts')
            .update({
                name,
                duration_minutes,
                rating
            })
            .eq('id', id)
            .eq('user_id', user.id)

        if (wError) throw wError

        // 2. Replace Exercises (Delete all and re-insert)
        // Note: Ideally we would diff/patch, but delete+insert is safer for MVP consistency
        const { error: delError } = await supabase
            .from('workout_exercises')
            .delete()
            .eq('workout_id', id)

        if (delError) throw delError

        if (exercises && exercises.length > 0) {
            const exerciseRows = exercises.map((ex: any) => ({
                workout_id: id,
                exercise_name: ex.exercise_name,
                sets_completed: ex.sets_completed,
                reps_completed: ex.reps_completed,
                weight_kg: ex.weight_kg,
                notes: ex.notes
            }))

            const { error: exError } = await supabase
                .from('workout_exercises')
                .insert(exerciseRows)

            if (exError) throw exError
        }

        return NextResponse.json({ success: true })

    } catch (e: any) {
        console.error(e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
