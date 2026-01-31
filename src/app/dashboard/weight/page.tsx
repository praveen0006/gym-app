'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Scale, Target, TrendingUp, Calendar, Plus, Edit2, Check, X, Clock, ArrowRight, Trash2 } from 'lucide-react'

export default function WeightPage() {
    const [loading, setLoading] = useState(true)
    const [weightLogs, setWeightLogs] = useState<any[]>([])
    const [activeGoal, setActiveGoal] = useState<any>(null)

    // Log Weight State
    const [newWeight, setNewWeight] = useState('')
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])
    const [isSubmittingLog, setIsSubmittingLog] = useState(false)

    const [isEditingGoal, setIsEditingGoal] = useState(false)
    const [editStartWeight, setEditStartWeight] = useState('')
    const [editStartDate, setEditStartDate] = useState('')
    const [editTargetWeight, setEditTargetWeight] = useState('')
    const [editTargetDate, setEditTargetDate] = useState('')
    const [isUpdatingGoal, setIsUpdatingGoal] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const res = await fetch('/api/weight')
            const data = await res.json()
            let current = null
            if (data.logs && data.logs.length > 0) {
                // Reverse to show oldest to newest in chart
                setWeightLogs([...data.logs].reverse())
                current = data.logs[0].weight // Newest is 0 in raw response (descending), but we set state reversed? 
                // Wait, API returns descending (line 17 of route.ts: .order('date', { ascending: false })).
                // So logs[0] is the LATEST.
                // In line 33 original: setWeightLogs([...data.logs].reverse()) -> State is ASCENDING (Old -> New).
                // So in state, last item is current.
            }
            if (data.goal) {
                setActiveGoal(data.goal)
                setEditStartWeight(data.goal.start_weight)
                setEditTargetWeight(data.goal.target_weight)
                setEditTargetDate(data.goal.target_date)
                setEditStartDate(data.goal.start_date || new Date().toISOString().split('T')[0])
            } else if (data.logs && data.logs.length > 0) {
                // Default start weight to current weight if no goal
                setEditStartWeight(data.logs[0].weight)
                setEditStartDate(data.logs[data.logs.length - 1].date) // Oldest log date
            }
        } catch (e) {
            console.error('Failed to fetch weight data', e)
        } finally {
            setLoading(false)
        }
    }

    const handleLogWeight = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newWeight || isSubmittingLog) return

        setIsSubmittingLog(true)
        try {
            const res = await fetch('/api/weight', {
                method: 'POST',
                body: JSON.stringify({
                    type: 'log_weight',
                    weight: parseFloat(newWeight),
                    date: newDate
                })
            })
            if (res.ok) {
                setNewWeight('')
                fetchData()
            }
        } catch (e) {
            console.error('Failed to log weight', e)
        } finally {
            setIsSubmittingLog(false)
        }
    }

    const handleUpdateGoal = async () => {
        if (!editTargetWeight || !editTargetDate || !editStartWeight || !editStartDate || isUpdatingGoal) return

        setIsUpdatingGoal(true)
        try {
            const res = await fetch('/api/weight', {
                method: 'POST',
                body: JSON.stringify({
                    type: 'set_goal',
                    start_weight: parseFloat(editStartWeight),
                    target_weight: parseFloat(editTargetWeight),
                    start_date: editStartDate,
                    target_date: editTargetDate
                })
            })

            if (res.ok) {
                setIsEditingGoal(false)
                fetchData()
            }
        } catch (e) {
            console.error('Failed to update goal', e)
        } finally {
            setIsUpdatingGoal(false)
        }
    }

    const handleDeleteLog = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this log?')) return
        try {
            const res = await fetch(`/api/weight?id=${id}`, { method: 'DELETE' })
            if (res.ok) fetchData()
        } catch (e) {
            console.error(e)
        }
    }

    const chartData = weightLogs.map((log: any) => ({
        date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: log.weight
    }))

    const currentWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : null

    // Progress Calculations
    let progressPercent = 0
    let weightDiff = 0
    let daysRemaining = 0
    let daysElapsed = 0

    if (activeGoal && currentWeight) {
        const totalToLose = Math.abs(activeGoal.start_weight - activeGoal.target_weight)
        const currentLost = Math.abs(activeGoal.start_weight - currentWeight)
        // Clamp 0-100
        progressPercent = Math.min(100, Math.max(0, (currentLost / totalToLose) * 100))

        weightDiff = Math.abs(activeGoal.target_weight - currentWeight)

        const today = new Date()
        const target = new Date(activeGoal.target_date)
        const start = new Date(activeGoal.start_date || activeGoal.created_at || new Date()) // Fallback to start_date

        const oneDay = 24 * 60 * 60 * 1000
        daysRemaining = Math.ceil((target.getTime() - today.getTime()) / oneDay)
        daysElapsed = Math.floor((today.getTime() - start.getTime()) / oneDay)
        if (daysElapsed < 0) daysElapsed = 0 // prevent negative if start date is today/future
    }

    if (loading) return <div className="p-8 text-center text-slate-500">Loading charts...</div>

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-slate-900">Weight Tracking</h1>
                <p className="text-slate-500">Monitor your numbers and reach your targets.</p>
            </div>

            {/* Main Chart Area */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="font-semibold text-slate-900">trends_</h2>
                    {currentWeight && (
                        <span className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600">
                            <Scale size={16} />
                            {currentWeight} kg
                        </span>
                    )}
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="#94a3b8"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                                minTickGap={30}
                            />
                            <YAxis
                                stroke="#94a3b8"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                domain={['auto', 'auto']}
                                dx={-10}
                            />
                            <Tooltip
                                contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                itemStyle={{ color: '#3b82f6', fontWeight: 600 }}
                            />
                            <Line
                                type="linear"
                                dataKey="weight"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                dot={{ fill: '#3b82f6', r: 4, stroke: '#fff', strokeWidth: 2 }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                            {activeGoal && (
                                <ReferenceLine
                                    y={activeGoal.target_weight}
                                    stroke="#10b981"
                                    strokeDasharray="4 4"
                                    label={{ value: 'Target', position: 'right', fill: '#10b981', fontSize: 12, fontWeight: 600 }}
                                />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 3-Card Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* 1. Current Weight Card */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="mb-4 flex items-center gap-2 text-slate-900">
                            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                                <Scale size={20} />
                            </div>
                            <h3 className="font-bold">Current Weight</h3>
                        </div>

                        <div className="mb-6 text-center">
                            <div className="text-4xl font-bold text-slate-900">{currentWeight || '--'}</div>
                            <div className="text-sm font-medium text-slate-400 uppercase tracking-wide">kilograms</div>
                        </div>
                    </div>

                    <form onSubmit={handleLogWeight} className="space-y-3">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={newWeight}
                                    onChange={(e) => setNewWeight(e.target.value)}
                                    placeholder="Log new..."
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmittingLog || !newWeight}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                Log
                            </button>
                        </div>
                        <div className="relative">
                            <input
                                type="date"
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
                                className="w-full text-xs text-slate-400 bg-transparent border-none p-0 focus:ring-0 text-center"
                            />
                        </div>
                    </form>
                </div>

                {/* 2. Goal Card */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
                    <div className="mb-4 flex items-center justify-between text-slate-900">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                                <Target size={20} />
                            </div>
                            <h3 className="font-bold">Goal</h3>
                        </div>
                        <button
                            onClick={() => setIsEditingGoal(!isEditingGoal)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                            {isEditingGoal ? <X size={16} /> : <Edit2 size={16} />}
                        </button>
                    </div>

                    {isEditingGoal ? (
                        <div className="flex-1 flex flex-col justify-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Current Weight (Start)</label>
                                <input
                                    type="number"
                                    value={editStartWeight}
                                    onChange={(e) => setEditStartWeight(e.target.value)}
                                    placeholder="Use as goal baseline"
                                    className="w-full p-2 border border-slate-200 rounded-lg text-slate-900 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={editStartDate}
                                    onChange={(e) => setEditStartDate(e.target.value)}
                                    className="w-full p-2 border border-slate-200 rounded-lg text-slate-900 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Target Weight</label>
                                <input
                                    type="number"
                                    value={editTargetWeight}
                                    onChange={(e) => setEditTargetWeight(e.target.value)}
                                    className="w-full p-2 border border-slate-200 rounded-lg text-slate-900 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Target Date</label>
                                <input
                                    type="date"
                                    value={editTargetDate}
                                    onChange={(e) => setEditTargetDate(e.target.value)}
                                    className="w-full p-2 border border-slate-200 rounded-lg text-slate-900 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                            <button
                                onClick={handleUpdateGoal}
                                disabled={isUpdatingGoal}
                                className="w-full py-2 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Check size={16} /> Update Goal
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4">
                            {activeGoal ? (
                                <>
                                    <div>
                                        <div className="flex items-baseline justify-center gap-2">
                                            <span className="text-xl font-medium text-slate-400 line-through">{activeGoal.start_weight}</span>
                                            <ArrowRight size={16} className="text-slate-300" />
                                            <span className="text-4xl font-bold text-slate-900">{activeGoal.target_weight}</span>
                                        </div>
                                        <div className="text-sm font-medium text-slate-400 uppercase tracking-wide">Target (kg)</div>
                                    </div>
                                    <div className="w-full h-px bg-slate-100" />
                                    <div className="flex items-center gap-2 text-slate-600 text-sm">
                                        <Calendar size={14} className="text-emerald-500" />
                                        <span>{new Date(activeGoal.target_date).toLocaleDateString()}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-slate-400 text-sm">No goal set. Click edit to set one.</div>
                            )}
                        </div>
                    )}
                </div>

                {/* 3. Progress Card */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
                    <div className="mb-4 flex items-center gap-2 text-slate-900">
                        <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                            <TrendingUp size={20} />
                        </div>
                        <h3 className="font-bold">Progress</h3>
                    </div>

                    {activeGoal ? (
                        <div className="flex-1 flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Left to go</span>
                                    <span className="font-bold text-slate-900">{weightDiff.toFixed(1)} kg</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Time remaining</span>
                                    <span className="font-bold text-slate-900">{daysRemaining > 0 ? `${daysRemaining} days` : 'Overdue'}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Days elapsed</span>
                                    <span className="font-bold text-slate-900">{daysElapsed} days</span>
                                </div>
                            </div>

                            <div className="mt-6 space-y-2">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                                    <span className="text-emerald-600">Completed</span>
                                    <span className="text-slate-900">{progressPercent.toFixed(0)}%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-1000"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                            <p>Set a goal to see progress stats</p>
                        </div>
                    )}
                </div>
            </div>
            {/* History Section */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 font-bold text-slate-900">History</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-slate-500">
                            <tr>
                                <th className="pb-3 font-medium">Date</th>
                                <th className="pb-3 font-medium">Weight</th>
                                <th className="pb-3 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {[...weightLogs].reverse().map((log: any) => (
                                <tr key={log.id}>
                                    <td className="py-3 text-slate-600">
                                        {new Date(log.date).toLocaleDateString()}
                                    </td>
                                    <td className="py-3 font-semibold text-slate-900">
                                        {log.weight} kg
                                    </td>
                                    <td className="py-3 text-right">
                                        <button
                                            onClick={() => handleDeleteLog(log.id)}
                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
