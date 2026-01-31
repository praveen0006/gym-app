import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

const USER_PLAN = [
    {
        day: 'Monday',
        name: 'Upper A (Heavy Push-Pull)',
        notes: 'Couch Stretch: 2 mins/side (Pre-workout requirement).',
        exercises: [
            { name: 'Incline Barbell Bench Press', sets: 4, reps_min: 6, reps_max: 8 },
            { name: 'Pull-ups / Lat Pulldown', sets: 4, reps_min: 8, reps_max: 10 },
            { name: 'Flat Dumbbell Press', sets: 3, reps_min: 8, reps_max: 10 },
            { name: 'Chest-Supported Row', sets: 3, reps_min: 10, reps_max: 10, notes: 'Squeeze at top' },
            { name: 'Lateral Raises', sets: 4, reps_min: 12, reps_max: 15 },
            { name: 'Rope Triceps Pushdown', sets: 3, reps_min: 12, reps_max: 12 }
        ]
    },
    {
        day: 'Tuesday',
        name: 'Lower A (Strength + Pelvic Reset)',
        notes: '90/90 Breathing: 3 sets of 10 breaths.',
        exercises: [
            { name: 'Back Squat', sets: 4, reps_min: 6, reps_max: 8, notes: 'Ribs tucked down' },
            { name: 'Lying Hamstring Curl', sets: 3, reps_min: 10, reps_max: 12 },
            { name: 'Bulgarian Split Squats', sets: 3, reps_min: 10, reps_max: 10, notes: '10 reps/leg' },
            { name: 'Dead Bug', sets: 3, reps_min: 12, reps_max: 12, notes: 'Slow, controlled' },
            { name: 'Standing Calf Raises', sets: 4, reps_min: 15, reps_max: 15 }
        ]
    },
    {
        day: 'Wednesday',
        name: 'Upper B (Shoulders & Arms)',
        exercises: [
            { name: 'Dumbbell Shoulder Press', sets: 4, reps_min: 6, reps_max: 8 },
            { name: 'Seated Cable Row', sets: 3, reps_min: 10, reps_max: 10, notes: '2-sec pause' },
            { name: 'Wide Lat Pulldown', sets: 3, reps_min: 12, reps_max: 12 },
            { name: 'Rear Delt Fly', sets: 4, reps_min: 15, reps_max: 15 },
            { name: 'EZ-Bar Curl', sets: 3, reps_min: 10, reps_max: 10 },
            { name: 'Hammer Curl', sets: 3, reps_min: 12, reps_max: 12, notes: 'Left arm first' },
            { name: 'Face Pulls', sets: 3, reps_min: 15, reps_max: 15 }
        ]
    },
    {
        day: 'Thursday',
        name: 'Lower B (Hypertrophy + Glutes)',
        exercises: [
            { name: 'Romanian Deadlift', sets: 4, reps_min: 8, reps_max: 8, notes: 'Hips back' },
            { name: 'Glute Bridge', sets: 3, reps_min: 15, reps_max: 15, notes: '2s hold' },
            { name: 'Seated Ham Curl', sets: 3, reps_min: 12, reps_max: 12 },
            { name: 'Hanging Knee Raise', sets: 3, reps_min: 12, reps_max: 12 },
            { name: 'Bird-Dog', sets: 3, reps_min: 10, reps_max: 10, notes: '10/side' },
            { name: 'Calf Raises', sets: 4, reps_min: 15, reps_max: 15 }
        ]
    },
    {
        day: 'Friday',
        name: 'Upper A (Volume & Form)',
        exercises: [
            { name: 'Dumbbell Flat Press', sets: 3, reps_min: 10, reps_max: 12 },
            { name: 'Lat Pulldown', sets: 3, reps_min: 12, reps_max: 12 },
            { name: 'Cable Fly (High to Low)', sets: 3, reps_min: 15, reps_max: 15 },
            { name: 'One-Arm Dumbbell Row', sets: 3, reps_min: 10, reps_max: 10 },
            { name: 'Lateral Raises', sets: 5, reps_min: 15, reps_max: 15 },
            { name: 'Overhead Triceps Extension', sets: 3, reps_min: 12, reps_max: 12 }
        ]
    },
    {
        day: 'Saturday',
        name: 'Upper B (Finishers & Conditioning)',
        exercises: [
            { name: 'Push-ups', sets: 2, reps_min: 0, reps_max: 0, notes: 'To failure' },
            { name: 'Straight-Arm Pulldown', sets: 3, reps_min: 12, reps_max: 12 },
            { name: 'Incline Dumbbell Curl', sets: 3, reps_min: 12, reps_max: 12 },
            { name: 'Rope Pushdown', sets: 3, reps_min: 12, reps_max: 12 },
            { name: 'RKC Plank', sets: 3, reps_min: 0, reps_max: 0, notes: '3x20 sceonds' },
            { name: 'Farmer’s Walk', sets: 3, reps_min: 0, reps_max: 0, notes: '3 rounds' }
        ]
    },
    {
        day: 'Sunday',
        name: 'Rest / Active Recovery',
        notes: 'Walk 10k steps. Focus on glute engagement.',
        exercises: []
    }
]

export async function POST() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // Clear existing schedule to avoid duplicates
        const { data: existing } = await supabase.from('workout_schedules').select('id').eq('user_id', user.id)
        if (existing && existing.length > 0) {
            // Optional: for now let's just return success if already seeded, OR delete and re-seed.
            // Let's delete to update with fresh plan if user clicks "Reset"
            for (const sch of existing) {
                await supabase.from('scheduled_exercises').delete().eq('schedule_id', sch.id)
                await supabase.from('workout_schedules').delete().eq('id', sch.id)
            }
        }

        // Insert new plan
        for (const plan of USER_PLAN) {
            const { data: schedule, error: schError } = await supabase
                .from('workout_schedules')
                .insert({
                    user_id: user.id,
                    day_of_week: plan.day,
                    name: plan.name,
                    notes: plan.notes
                })
                .select()
                .single()

            if (schError) throw schError

            if (plan.exercises.length > 0) {
                const exercisesToInsert = plan.exercises.map(ex => ({
                    schedule_id: schedule.id,
                    exercise_name: ex.name,
                    target_sets: ex.sets,
                    target_reps_min: ex.reps_min,
                    target_reps_max: ex.reps_max,
                    notes: ex.notes
                }))

                const { error: exError } = await supabase
                    .from('scheduled_exercises')
                    .insert(exercisesToInsert)

                if (exError) throw exError
            }
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Seeding error', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
