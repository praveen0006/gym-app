'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Calendar, Edit2, Plus, Trash2, X, RefreshCw, Loader2 } from 'lucide-react'

export default function SchedulePage() {
    const [schedule, setSchedule] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [seeding, setSeeding] = useState(false)

    // Edit state
    const [editingDay, setEditingDay] = useState<any | null>(null)
    const [editName, setEditName] = useState('')
    const [editNotes, setEditNotes] = useState('')
    const [editExercises, setEditExercises] = useState<any[]>([])
    const [saving, setSaving] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        fetchSchedule()
    }, [])

    const fetchSchedule = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('workout_schedules')
                .select(`*, scheduled_exercises (*)`)
                .eq('user_id', user.id)

            if (data) {
                const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                const sorted = data.sort((a, b) => days.indexOf(a.day_of_week) - days.indexOf(b.day_of_week))
                setSchedule(sorted)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleLoadPlan = async () => {
        setSeeding(true)
        try {
            const res = await fetch('/api/schedule/seed', { method: 'POST' })
            if (res.ok) {
                fetchSchedule()
            } else {
                alert('Failed to load plan')
            }
        } catch (e) {
            alert('Failed to load plan')
        } finally {
            setSeeding(false)
        }
    }

    const openEditModal = (day: any) => {
        setEditingDay(day)
        setEditName(day.name)
        setEditNotes(day.notes || '')
        setEditExercises(day.scheduled_exercises?.map((ex: any) => ({
            exercise_name: ex.exercise_name,
            target_sets: ex.target_sets,
            target_reps_min: ex.target_reps_min,
            target_reps_max: ex.target_reps_max,
            notes: ex.notes || ''
        })) || [])
    }

    const closeEditModal = () => {
        setEditingDay(null)
        setEditName('')
        setEditNotes('')
        setEditExercises([])
    }

    const handleExerciseChange = (index: number, field: string, value: any) => {
        const updated = [...editExercises]
        updated[index][field] = value
        setEditExercises(updated)
    }

    const addExercise = () => {
        setEditExercises([...editExercises, { exercise_name: '', target_sets: 3, target_reps_min: 10, target_reps_max: 10, notes: '' }])
    }

    const removeExercise = (index: number) => {
        setEditExercises(editExercises.filter((_, i) => i !== index))
    }

    const handleSave = async () => {
        if (!editingDay) return
        setSaving(true)

        try {
            const res = await fetch('/api/schedule', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingDay.id,
                    name: editName,
                    notes: editNotes,
                    exercises: editExercises.filter(e => e.exercise_name)
                })
            })

            if (res.ok) {
                fetchSchedule()
                closeEditModal()
            } else {
                alert('Failed to save')
            }
        } catch (e) {
            console.error(e)
            alert('Error saving')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-slate-500">Loading schedule...</div>

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-slate-900">Weekly Schedule</h1>
                <p className="text-slate-500">Your personalized training map.</p>
            </div>

            {schedule.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
                    <div className="mb-4 rounded-full bg-slate-100 p-4">
                        <Calendar size={32} className="text-slate-400" />
                    </div>
                    <h2 className="mb-2 text-xl font-semibold text-slate-900">No Schedule Found</h2>
                    <p className="mb-6 max-w-sm text-slate-500">Get started with our recommended "Upper/Lower Split" to kickstart your journey.</p>
                    <button
                        onClick={handleLoadPlan}
                        disabled={seeding}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                    >
                        {seeding ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                        {seeding ? 'Loading Plan...' : 'Load Default Plan'}
                    </button>
                </div>
            ) : (
                <>
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {schedule.map((day) => (
                            <div key={day.id} className="group flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:border-blue-200 hover:-translate-y-1 overflow-hidden">
                                {/* Header */}
                                <div className="bg-slate-50/50 p-5 border-b border-slate-100 flex items-start justify-between">
                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">{day.day_of_week}</div>
                                        <h3 className="text-xl font-bold text-slate-900 leading-tight group-hover:text-blue-700 transition-colors">{day.name}</h3>
                                    </div>
                                    <button
                                        onClick={() => openEditModal(day)}
                                        className="rounded-full bg-white p-2 text-slate-400 shadow-sm opacity-0 transition-opacity hover:text-blue-600 hover:shadow-md group-hover:opacity-100"
                                        title="Edit Day"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                </div>

                                <div className="flex-1 p-5 flex flex-col gap-4">
                                    {day.notes && (
                                        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 border border-amber-100 italic flex items-start gap-2">
                                            <span className="select-none">💡</span>
                                            {day.notes}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        {day.scheduled_exercises?.length > 0 ? (
                                            Array.from(new Map(day.scheduled_exercises.map((ex: any) => [ex.exercise_name, ex])).values()).map((ex: any) => (
                                                <div key={ex.id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm transition-colors hover:bg-blue-50">
                                                    <span className="font-semibold text-slate-700">{ex.exercise_name}</span>
                                                    <span className="font-mono text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                                        {ex.target_sets} × {ex.target_reps_min === ex.target_reps_max ? ex.target_reps_min : `${ex.target_reps_min}-${ex.target_reps_max}`}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-6 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                                                <div className="text-2xl mb-2">🌿</div>
                                                <div className="font-medium text-slate-900">Rest & Recovery</div>
                                                <div className="text-xs text-slate-500">recharge for the next session</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 text-center">
                        <button
                            onClick={() => {
                                if (confirm('This will completely reset your schedule and fix any duplicate entries. Are you sure?')) handleLoadPlan()
                            }}
                            className="text-sm text-slate-400 hover:text-red-500 hover:underline transition-colors"
                        >
                            Fix Duplicates / Reset Plan
                        </button>
                    </div>
                </>
            )}

            {/* Edit Modal */}
            {editingDay && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">Edit {editingDay.day_of_week}</h2>
                            <button onClick={closeEditModal} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
                            <div className="grid gap-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Workout Name</label>
                                        <input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="block w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="e.g. Leg Day"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Notes / Focus</label>
                                        <input
                                            value={editNotes}
                                            onChange={(e) => setEditNotes(e.target.value)}
                                            className="block w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="e.g. Focus on form"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="mb-3 flex items-center justify-between">
                                        <label className="text-sm font-medium text-slate-700">Exercises</label>
                                        <button
                                            onClick={addExercise}
                                            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                                        >
                                            <Plus size={14} /> Add Exercise
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {editExercises.map((ex, i) => (
                                            <div key={i} className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 sm:flex-row sm:items-center">
                                                <input
                                                    placeholder="Exercise Name"
                                                    value={ex.exercise_name}
                                                    onChange={(e) => handleExerciseChange(i, 'exercise_name', e.target.value)}
                                                    className="block w-full flex-[2] rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                                                />
                                                <div className="flex gap-2 sm:flex-1">
                                                    <input
                                                        type="number"
                                                        placeholder="Sets"
                                                        value={ex.target_sets}
                                                        onChange={(e) => handleExerciseChange(i, 'target_sets', parseInt(e.target.value) || 0)}
                                                        className="block w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Min"
                                                        value={ex.target_reps_min}
                                                        onChange={(e) => handleExerciseChange(i, 'target_reps_min', parseInt(e.target.value) || 0)}
                                                        className="block w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Max"
                                                        value={ex.target_reps_max}
                                                        onChange={(e) => handleExerciseChange(i, 'target_reps_max', parseInt(e.target.value) || 0)}
                                                        className="block w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => removeExercise(i)}
                                                    className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        {editExercises.length === 0 && (
                                            <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">
                                                No exercises added. This will be a rest day.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 px-6 py-4 flex justify-end gap-3 bg-slate-50">
                            <button
                                onClick={closeEditModal}
                                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
