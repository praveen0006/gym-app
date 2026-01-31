'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, Trash2, Calendar, Dumbbell, Clock, ChevronRight } from 'lucide-react'

export default function WorkoutsPage() {
    const [workouts, setWorkouts] = useState<any[]>([])
    const [todaySchedule, setTodaySchedule] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    // Form State
    const [workoutName, setWorkoutName] = useState('')
    const [duration, setDuration] = useState('')
    const [rating, setRating] = useState('3')
    const [exercises, setExercises] = useState<any[]>([
        { exercise_name: '', sets_completed: '', reps_completed: '', weight_kg: '' }
    ])
    const [submitting, setSubmitting] = useState(false)
    const [showForm, setShowForm] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // 1. Fetch History
            const res = await fetch('/api/workouts')
            const history = await res.json()
            if (Array.isArray(history)) {
                setWorkouts(history)
            }

            // 2. Fetch Today's Schedule
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
            const todayName = days[new Date().getDay()]

            const { data: schedule } = await supabase
                .from('workout_schedules')
                .select(`*, scheduled_exercises (*)`)
                .eq('user_id', user.id)
                .eq('day_of_week', todayName)
                .single()

            if (schedule) {
                setTodaySchedule(schedule)
            }

        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const prefillFromSchedule = () => {
        if (!todaySchedule) return
        setWorkoutName(todaySchedule.name)

        if (todaySchedule.scheduled_exercises) {
            setExercises(todaySchedule.scheduled_exercises.map((ex: any) => ({
                exercise_name: ex.exercise_name,
                sets_completed: ex.target_sets,
                reps_completed: ex.target_reps_min, // Default to min
                weight_kg: ''
            })))
        }
        setShowForm(true)
    }

    const handleExerciseChange = (index: number, field: string, value: string) => {
        const newEx = [...exercises]
        newEx[index][field] = value
        setExercises(newEx)
    }

    const addExerciseRow = () => {
        setExercises([...exercises, { exercise_name: '', sets_completed: '', reps_completed: '', weight_kg: '' }])
    }

    const removeExerciseRow = (index: number) => {
        setExercises(exercises.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            const res = await fetch('/api/workouts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: workoutName,
                    duration_minutes: parseInt(duration) || 0,
                    rating: parseInt(rating),
                    exercises: exercises.filter(e => e.exercise_name), // Only save valid rows
                    schedule_id: todaySchedule?.id
                })
            })

            if (res.ok) {
                alert('Workout Saved!')
                fetchData()
                setShowForm(false)
                // Reset
                setWorkoutName('')
                setDuration('')
                setExercises([{ exercise_name: '', sets_completed: '', reps_completed: '', weight_kg: '' }])
            } else {
                alert('Failed to save')
            }
        } catch (e) {
            console.error(e)
            alert('Error saving workout')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-slate-500">Loading workouts...</div>

    return (
        <div className="mx-auto max-w-5xl space-y-8">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-slate-900">Workout Log</h1>
                <p className="text-slate-500">Track your strength and consistency.</p>
            </div>

            {/* Today's Schedule Card */}
            {todaySchedule && !showForm && (
                <div className="overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white shadow-lg">
                    <div className="mb-4 flex items-start justify-between">
                        <div>
                            <div className="mb-2 flex items-center gap-2 text-blue-100">
                                <Calendar size={18} />
                                <span className="text-sm font-medium uppercase tracking-wider">{todaySchedule.day_of_week}</span>
                            </div>
                            <h2 className="text-3xl font-bold">{todaySchedule.name}</h2>
                            <p className="mt-1 text-blue-100 opacity-90">Ready to crush it?</p>
                        </div>
                        <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
                            <Dumbbell size={32} className="text-white" />
                        </div>
                    </div>

                    <div className="mt-6 flex gap-4">
                        <button
                            onClick={prefillFromSchedule}
                            className="rounded-lg bg-white px-6 py-3 font-semibold text-blue-600 shadow-sm transition-colors hover:bg-blue-50"
                        >
                            Start Workout
                        </button>
                        <button
                            onClick={() => setShowForm(true)}
                            className="rounded-lg border border-white/30 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                        >
                            Log Custom
                        </button>
                    </div>
                </div>
            )}

            {!todaySchedule && !showForm && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
                    <h2 className="mb-2 text-xl font-semibold text-slate-900">No workout scheduled for today</h2>
                    <p className="mb-6 text-slate-500">Rest day or off-schedule training?</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                    >
                        <Plus size={18} />
                        Log Workout
                    </button>
                </div>
            )}

            {showForm && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-6 text-xl font-bold text-slate-900">Log Workout</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-3">
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-medium text-slate-700">Workout Name</label>
                                <input
                                    className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={workoutName}
                                    onChange={e => setWorkoutName(e.target.value)}
                                    placeholder="e.g. Upper Body Power"
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Duration (mins)</label>
                                <input
                                    type="number"
                                    className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={duration}
                                    onChange={e => setDuration(e.target.value)}
                                    placeholder="60"
                                />
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">Exercises</h3>
                            <div className="space-y-3">
                                {exercises.map((ex, i) => (
                                    <div key={i} className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 sm:flex-row sm:items-center">
                                        <input
                                            className="block w-full flex-[2] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                            placeholder="Exercise Name"
                                            value={ex.exercise_name}
                                            onChange={e => handleExerciseChange(i, 'exercise_name', e.target.value)}
                                        />
                                        <div className="flex gap-3 sm:flex-1">
                                            <input
                                                className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                                type="number"
                                                placeholder="Sets"
                                                value={ex.sets_completed}
                                                onChange={e => handleExerciseChange(i, 'sets_completed', e.target.value)}
                                            />
                                            <input
                                                className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                                type="number"
                                                placeholder="Reps"
                                                value={ex.reps_completed}
                                                onChange={e => handleExerciseChange(i, 'reps_completed', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex items-center gap-3 sm:flex-1">
                                            <div className="relative w-full">
                                                <input
                                                    className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 pr-8 text-sm focus:border-blue-500 focus:outline-none"
                                                    type="number"
                                                    placeholder="Weight"
                                                    value={ex.weight_kg}
                                                    onChange={e => handleExerciseChange(i, 'weight_kg', e.target.value)}
                                                />
                                                <span className="absolute right-3 top-2 text-xs text-slate-400">kg</span>
                                            </div>
                                            <button
                                                type="button"
                                                className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
                                                onClick={() => removeExerciseRow(i)}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                className="mt-4 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                                onClick={addExerciseRow}
                            >
                                <Plus size={16} />
                                Add Exercise
                            </button>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                disabled={submitting}
                            >
                                {submitting ? 'Saving...' : 'Save Log'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Recent History</h2>
                <div className="grid gap-4">
                    {workouts.map(workout => (
                        <div key={workout.id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">{workout.name}</h3>
                                    <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            {new Date(workout.date).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} />
                                            {workout.duration_minutes} mins
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-2xl" title="Rating">
                                        {workout.rating >= 4 ? '🔥' : workout.rating >= 3 ? '👍' : '😴'}
                                    </div>
                                    <div className="rounded-full bg-slate-50 p-2 text-slate-400 transition-colors group-hover:bg-slate-100 group-hover:text-slate-600">
                                        <ChevronRight size={20} />
                                    </div>
                                </div>
                            </div>

                            {workout.workout_exercises && workout.workout_exercises.length > 0 && (
                                <div className="mt-4 border-t border-slate-100 pt-4">
                                    <div className="flex flex-wrap gap-2">
                                        {workout.workout_exercises.map((ex: any) => (
                                            <div key={ex.id} className="rounded-md bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                                                <span className="mr-1 text-slate-900">{ex.exercise_name}</span>
                                                <span className="text-slate-400">{ex.sets_completed}x{ex.reps_completed}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
