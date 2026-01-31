'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { Activity, Flame, Heart, Footprints, RefreshCw, Smartphone } from 'lucide-react'
import ActivityChart from './ActivityChart'
import ChatWindow from './ChatWindow'
import HealthScoreCard from './HealthScoreCard'
import DeleteDataButton from './DeleteDataButton'

export default function DashboardClient({ userEmail }: { userEmail: string }) {
    const supabase = createClient()

    // State for all data
    const [isConnected, setIsConnected] = useState(false)
    const [todayActivity, setTodayActivity] = useState<any>(null)
    const [activity, setActivity] = useState<any[]>([])
    const [currentWeight, setCurrentWeight] = useState<number | null>(null)
    const [activeGoal, setActiveGoal] = useState<any>(null)
    const [goalType, setGoalType] = useState<'lose' | 'gain'>('lose')
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)
    const [lastSynced, setLastSynced] = useState<Date | null>(null)

    // Log Weight State
    const [newWeight, setNewWeight] = useState('')
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])
    const [isSubmittingLog, setIsSubmittingLog] = useState(false)

    // Fetch all dashboard data
    const fetchData = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Check connection
            const { data: integration } = await supabase
                .from('integrations')
                .select('id')
                .eq('user_id', user.id)
                .eq('provider', 'google_fit')
                .maybeSingle()

            setIsConnected(!!integration)

            // Fetch activity
            const { data: activityData } = await supabase
                .from('daily_activity')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .limit(7)

            if (activityData) {
                setActivity(activityData)
                const today = new Date().toISOString().split('T')[0]
                const todayData = activityData.find(a => a.date === today)
                setTodayActivity(todayData || null)
            }

            // Fetch weight
            const { data: weightData } = await supabase
                .from('weight_logs')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (weightData) {
                setCurrentWeight(weightData.weight)
            }

            // Fetch goal
            const { data: goalData } = await supabase
                .from('user_goals')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .maybeSingle()

            setActiveGoal(goalData)
            if (goalData) {
                setGoalType(goalData.target_weight > goalData.start_weight ? 'gain' : 'lose')
            }

        } catch (e) {
            console.error('Error fetching dashboard data:', e)
        } finally {
            setLoading(false)
        }
    }, [supabase])

    // Initial fetch
    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Auto-sync on mount (with delay)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isConnected) {
                handleSync()
            }
        }, 2000)
        return () => clearTimeout(timer)
    }, [isConnected])

    // Sync function (AJAX - no page reload)
    const handleSync = async () => {
        if (syncing) return
        setSyncing(true)

        try {
            const res = await fetch('/api/fit/sync', { method: 'POST' })
            if (res.ok) {
                console.log('[Sync] Success - refreshing data...')
                await fetchData() // Just refresh data, no page reload!
                setLastSynced(new Date())
            }
        } catch (e) {
            console.error('[Sync] Failed:', e)
        } finally {
            setSyncing(false)
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
                // Refresh data to show new weight
                fetchData()
            }
        } catch (e) {
            console.error('Failed to log weight', e)
        } finally {
            setIsSubmittingLog(false)
        }
    }

    // Calculate weight progress
    const weightProgress = activeGoal && currentWeight
        ? Math.max(0, Math.min(100, ((activeGoal.start_weight - currentWeight) / (activeGoal.start_weight - activeGoal.target_weight)) * 100))
        : null

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center text-slate-400">
                Loading dashboard...
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-500">Welcome back, {userEmail}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Connection Status Card */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900">Data Source</h3>
                        {isConnected && (
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
                        )}
                    </div>

                    {isConnected ? (
                        <div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Smartphone size={16} className="text-slate-400" />
                                Google Fit Connected
                            </div>

                            <button
                                onClick={handleSync}
                                disabled={syncing}
                                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-70"
                            >
                                <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
                                {syncing ? 'Syncing...' : 'Sync Now'}
                            </button>

                            {lastSynced && (
                                <p className="mt-2 text-center text-xs text-slate-400">
                                    Last synced: {lastSynced.toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div>
                            <p className="mb-4 text-sm text-slate-500">
                                Connect Google Fit to automatically track your steps, calories, and heart points.
                            </p>
                            <Link
                                href="/api/fit/auth"
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                            >
                                <Smartphone size={16} />
                                Connect Google Fit
                            </Link>
                        </div>
                    )}
                </div>

                {/* Today's Overview */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
                    <div className="mb-6 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900">Today's Overview</h3>
                        {syncing && <span className="text-xs text-blue-500 font-medium">Updating...</span>}
                    </div>

                    {todayActivity ? (
                        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                            <div className="rounded-lg bg-slate-50 p-4">
                                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
                                    <Footprints size={16} className="text-blue-500" />
                                    Steps
                                </div>
                                <div className="text-2xl font-bold text-slate-900">
                                    {todayActivity.steps?.toLocaleString() || 0}
                                </div>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-4">
                                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
                                    <Flame size={16} className="text-orange-500" />
                                    Calories
                                </div>
                                <div className="text-2xl font-bold text-slate-900">
                                    {todayActivity.calories?.toFixed(0) || 0}
                                </div>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-4">
                                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
                                    <Activity size={16} className="text-emerald-500" />
                                    Active Min
                                </div>
                                <div className="text-2xl font-bold text-slate-900">
                                    {todayActivity.active_minutes || 0}
                                </div>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-4">
                                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
                                    <Heart size={16} className="text-rose-500" />
                                    Heart Pts
                                </div>
                                <div className="text-2xl font-bold text-slate-900">
                                    {todayActivity.heart_minutes || 0}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <p className="text-slate-500">No data available for today.</p>
                            {isConnected && (
                                <button
                                    onClick={handleSync}
                                    className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                                >
                                    Sync Data
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Health Score */}
                <HealthScoreCard />

                {/* Weight Progress */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2 flex flex-col justify-between">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <RefreshCw size={20} />
                            </div>
                            <h3 className="font-semibold text-slate-900">Weight Progress</h3>
                        </div>

                        {/* Goal Type Toggle */}
                        <div className="flex items-center rounded-lg bg-slate-100 p-1">
                            <button
                                onClick={() => setGoalType('lose')}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${goalType === 'lose'
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                Weight Loss
                            </button>
                            <button
                                onClick={() => setGoalType('gain')}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${goalType === 'gain'
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                Weight Gain
                            </button>
                        </div>
                    </div>

                    {activeGoal ? (
                        <div className="flex flex-col h-full justify-around">
                            <div className="grid grid-cols-3 items-center gap-6 mb-8">
                                <div className="flex flex-col items-center">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Start</span>
                                    <span className="text-2xl font-bold text-slate-700">{activeGoal.start_weight}</span>
                                    <span className="text-xs text-slate-400">kg</span>
                                </div>

                                <div className="flex items-center justify-center">
                                    <div className="relative flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl ring-4 ring-blue-50">
                                        <div className="text-center">
                                            <div className="text-3xl font-bold tracking-tight">{currentWeight || '--'}</div>
                                            <div className="text-xs font-medium opacity-80">Current</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Goal</span>
                                    <span className="text-2xl font-bold text-emerald-600">{activeGoal.target_weight}</span>
                                    <span className="text-xs text-slate-400">kg</span>
                                </div>
                            </div>

                            {/* Status Badge */}
                            {currentWeight && activeGoal.start_weight !== currentWeight && (
                                <div className={`mb-6 flex items-center gap-4 rounded-xl border p-4 ${currentWeight < activeGoal.start_weight
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                    : 'border-red-200 bg-red-50 text-red-800'
                                    }`}>
                                    <div className={`p-3 rounded-full ${currentWeight < activeGoal.start_weight ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                        {currentWeight < activeGoal.start_weight
                                            ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>
                                            : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                                        }
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-bold tracking-tight">
                                                {Math.abs(activeGoal.start_weight - currentWeight).toFixed(1)}
                                            </span>
                                            <span className="text-sm font-semibold opacity-70">kg</span>
                                        </div>
                                        <div className="text-xs font-bold uppercase tracking-wide opacity-70">
                                            {currentWeight < activeGoal.start_weight ? 'Total Weight Lost' : 'Total Weight Gained'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Progress Bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                                    <span>Progress ({goalType === 'lose' ? 'Loss' : 'Gain'})</span>
                                    <span className="text-blue-600">{weightProgress?.toFixed(0) || 0}%</span>
                                </div>
                                <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 shadow-lg transition-all duration-1000 ease-out"
                                        style={{ width: `${weightProgress || 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 text-center flex flex-col items-center justify-center">
                            <div className="mb-4 rounded-full bg-slate-100 p-4">
                                <DeleteDataButton />
                            </div>
                            <p className="mb-6 text-slate-500 max-w-xs">You haven't set a weight goal yet. Set one to track your progress.</p>
                            <Link
                                href="/dashboard/weight"
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                            >
                                Set a Goal
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Activity Chart */}
            {isConnected && activity.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-6 font-semibold text-slate-900">Activity Trends</h3>
                    <ActivityChart data={activity} />
                </div>
            )}

            <ChatWindow />
        </div>
    )
}
