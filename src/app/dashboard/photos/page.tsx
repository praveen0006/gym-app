'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { Upload, X, Camera, Calendar, Trash2, ArrowRight, Zap, RefreshCw } from 'lucide-react'

export default function PhotosPage() {
    const [photos, setPhotos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
    const [analyzingId, setAnalyzingId] = useState<string | null>(null)
    const [analysisResult, setAnalysisResult] = useState<any>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchPhotos()
    }, [])

    const fetchPhotos = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const res = await fetch('/api/photos')
            const data = await res.json()

            // Get public URLs for each photo
            const photosWithUrls = await Promise.all(data.map(async (photo: any) => {
                const { data: { publicUrl } } = supabase.storage
                    .from('progress-photos')
                    .getPublicUrl(photo.storage_path)
                return { ...photo, publicUrl }
            }))

            setPhotos(photosWithUrls)
        } catch (e) {
            console.error('Failed to fetch photos', e)
        } finally {
            setLoading(false)
        }
    }

    // Helper to group photos by week
    const groupPhotosByWeek = (photos: any[]) => {
        const groups: { [key: string]: any[] } = {}
        photos.forEach(photo => {
            const date = new Date(photo.date)
            // Get start of the week (Sunday)
            const startOfWeek = new Date(date)
            startOfWeek.setDate(date.getDate() - date.getDay())
            const weekKey = startOfWeek.toISOString().split('T')[0]

            if (!groups[weekKey]) groups[weekKey] = []
            groups[weekKey].push(photo)
        })

        // Sort keys descending (newest weeks first)
        return Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(key => ({
            weekStart: key,
            photos: groups[key]
        }))
    }

    const weeklyGroups = groupPhotosByWeek(photos)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}/${Date.now()}.${fileExt}`
            const filePath = fileName

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('progress-photos')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // 2. Save metadata to DB
            const res = await fetch('/api/photos', {
                method: 'POST',
                body: JSON.stringify({
                    storage_path: filePath,
                    date: new Date().toISOString().split('T')[0],
                    notes: ''
                })
            })

            if (res.ok) {
                fetchPhotos()
            }
        } catch (e) {
            console.error('Upload failed', e)
            alert('Failed to upload photo')
        } finally {
            setUploading(false)
        }
    }

    const handleAnalyze = async (e: React.MouseEvent, photo: any) => {
        e.stopPropagation()
        setAnalyzingId(photo.id)
        try {
            const res = await fetch('/api/analyze-photo', {
                method: 'POST',
                body: JSON.stringify({
                    photoId: photo.id,
                    storagePath: photo.storage_path
                })
            })
            const data = await res.json()
            if (data.analysis) {
                setAnalysisResult(data.analysis)
                // Refresh photos to update local state if needed
                fetchPhotos()
            } else {
                alert('Analysis failed')
            }
        } catch (error) {
            console.error('Analysis error', error)
            alert('Failed to analyze photo')
        } finally {
            setAnalyzingId(null)
        }
    }

    const toggleSelection = (id: string) => {
        setSelectedPhotos(prev => {
            if (prev.includes(id)) {
                return prev.filter(pId => pId !== id)
            }
            if (prev.length >= 2) {
                return [prev[1], id]
            }
            return [...prev, id]
        })
    }

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/photos?id=${id}`, { method: 'DELETE' })
            if (res.ok) {
                setPhotos(prev => prev.filter(p => p.id !== id))
                setSelectedPhotos(prev => prev.filter(pId => pId !== id))
            } else {
                alert('Failed to delete photo')
            }
        } catch (e) {
            console.error('Delete failed', e)
        }
    }

    // Auto-select for comparison: Current Week vs Previous Week
    const handleSmartCompare = () => {
        // Need at least 2 distinct weeks with photos
        if (weeklyGroups.length < 2) {
            alert("Need photos from at least two different weeks to work!")
            return
        }
        // Take first photo of newest week
        const latestWeek = weeklyGroups[0]
        const previousWeek = weeklyGroups[1]

        if (latestWeek.photos.length > 0 && previousWeek.photos.length > 0) {
            const photoA = previousWeek.photos[0].id // Old
            const photoB = latestWeek.photos[0].id   // New

            // Navigate to comparison
            window.location.href = `/dashboard/photos/compare?a=${photoA}&b=${photoB}`
        }
    }

    if (loading) return <div className="p-8 text-center text-slate-500">Loading gallery...</div>

    return (
        <div className="mx-auto max-w-7xl space-y-8 pb-12">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Progress Photos</h1>
                    <p className="text-slate-500">Visualise your journey week by week.</p>
                </div>
                <div className="flex items-center gap-3">
                    {weeklyGroups.length >= 2 && (
                        <button
                            onClick={handleSmartCompare}
                            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 shadow-sm"
                        >
                            <Zap size={16} /> Auto-Compare Weeks
                        </button>
                    )}

                    {selectedPhotos.length === 2 && (
                        <Link
                            href={`/dashboard/photos/compare?a=${selectedPhotos[0]}&b=${selectedPhotos[1]}`}
                            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                        >
                            Compare Selected <ArrowRight size={16} />
                        </Link>
                    )}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        disabled={uploading}
                    >
                        {uploading ? <RefreshCw className="animate-spin" size={16} /> : <Upload size={16} />}
                        {uploading ? 'Uploading...' : 'Upload New'}
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleUpload}
                        accept="image/*"
                    />
                </div>
            </div>

            {photos.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-24 text-center">
                    <div className="mb-4 rounded-full bg-white p-4 shadow-sm">
                        <Camera size={32} className="text-slate-400" />
                    </div>
                    <h2 className="mb-2 text-xl font-semibold text-slate-900">No photos yet</h2>
                    <p className="mb-6 max-w-sm text-slate-500">Upload your first progress photo to start tracking.</p>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white shadow-sm hover:bg-blue-700"
                    >
                        Select Photo
                    </button>
                </div>
            ) : (
                <div className="space-y-12">
                    {weeklyGroups.map((group) => (
                        <div key={group.weekStart}>
                            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-700 border-b pb-2">
                                <Calendar size={20} className="text-slate-400" />
                                Week of {new Date(group.weekStart).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                            </h3>
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {group.photos.map((photo: any) => {
                                    const isSelected = selectedPhotos.includes(photo.id)
                                    const selectionIndex = selectedPhotos.indexOf(photo.id)

                                    return (
                                        <div
                                            key={photo.id}
                                            className={`group relative overflow-hidden rounded-xl border bg-white shadow-sm transition-all cursor-pointer ${isSelected
                                                ? 'border-blue-500 ring-4 ring-blue-50'
                                                : 'border-slate-200 hover:border-blue-300'
                                                }`}
                                            onClick={() => toggleSelection(photo.id)}
                                        >
                                            {isSelected && (
                                                <div className="absolute left-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-md">
                                                    {selectionIndex + 1}
                                                </div>
                                            )}

                                            <div className="aspect-[3/4] w-full overflow-hidden bg-slate-100">
                                                <img
                                                    src={photo.publicUrl}
                                                    alt={`Progress from ${photo.date}`}
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            </div>

                                            <div className="p-4">
                                                <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                                                    <Calendar size={14} />
                                                    {new Date(photo.date).toLocaleDateString(undefined, {
                                                        weekday: 'short',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </div>

                                                {photo.notes && <p className="mb-4 text-sm text-slate-600 line-clamp-2">{photo.notes}</p>}

                                                <div className="flex gap-2">
                                                    <button
                                                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${photo.ai_analysis
                                                            ? 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                            }`}
                                                        onClick={(e) => {
                                                            if (photo.ai_analysis) {
                                                                e.stopPropagation()
                                                                setAnalysisResult(JSON.parse(photo.ai_analysis))
                                                            } else {
                                                                handleAnalyze(e, photo)
                                                            }
                                                        }}
                                                        disabled={analyzingId === photo.id}
                                                    >
                                                        <Zap size={14} className={analyzingId === photo.id ? 'animate-pulse' : ''} />
                                                        {analyzingId === photo.id ? 'Analyzing...' : photo.ai_analysis ? 'View Stats' : 'Analyze'}
                                                    </button>

                                                    <button
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            if (confirm('Are you sure?')) handleDelete(photo.id)
                                                        }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Analysis Modal */}
            {analysisResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={() => setAnalysisResult(null)}>
                    <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Zap size={20} className="text-purple-600 fill-purple-600" />
                                AI Physique Analysis
                            </h2>
                            <button onClick={() => setAnalysisResult(null)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            <div>
                                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">Observations</h3>
                                <ul className="space-y-1">
                                    {analysisResult.observations?.map((obs: string, i: number) => (
                                        <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                                            {obs}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">Muscle Groups</h3>
                                <div className="flex flex-wrap gap-2">
                                    {analysisResult.muscle_groups?.map((mg: string, i: number) => (
                                        <span key={i} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                            {mg}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-xl bg-purple-50 p-4">
                                <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-purple-500">Est. Body Fat</h3>
                                <p className="text-lg font-bold text-purple-900">{analysisResult.estimated_body_fat}</p>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-5 italic text-slate-600 text-sm border-l-4 border-blue-400">
                                "{analysisResult.advice}"
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
