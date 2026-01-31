'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { Zap, RefreshCw, ArrowLeft, ArrowRight, TrendingUp, Sparkles } from 'lucide-react'

export default function ComparePage() {
    const searchParams = useSearchParams()
    const photoIdA = searchParams.get('a')
    const photoIdB = searchParams.get('b')

    const [photoA, setPhotoA] = useState<any>(null)
    const [photoB, setPhotoB] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [analyzing, setAnalyzing] = useState(false)
    const [analysis, setAnalysis] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        if (photoIdA && photoIdB) {
            fetchComparisonData()
        }
    }, [photoIdA, photoIdB])

    const fetchComparisonData = async () => {
        try {
            const { data: photos, error } = await supabase
                .from('progress_photos')
                .select('*')
                .in('id', [photoIdA, photoIdB])

            if (error) throw error

            const photosWithUrls = await Promise.all(photos.map(async (photo: any) => {
                const { data: { publicUrl } } = supabase.storage
                    .from('progress-photos')
                    .getPublicUrl(photo.storage_path)
                return { ...photo, publicUrl }
            }))

            // Sort to match order of selection or date
            const sorted = photosWithUrls.sort((a, b) =>
                new Date(a.date).getTime() - new Date(b.date).getTime()
            )

            setPhotoA(sorted[0])
            setPhotoB(sorted[1])
        } catch (e) {
            console.error('Failed to fetch comparison data', e)
        } finally {
            setLoading(false)
        }
    }

    const handleAnalyze = async () => {
        if (!photoA || !photoB || analyzing) return
        setAnalyzing(true)
        try {
            const res = await fetch('/api/analyze-photo', {
                method: 'POST',
                body: JSON.stringify({
                    photoId: photoA.id,
                    storagePath: photoA.storage_path,
                    dateA: photoA.date,
                    photoIdB: photoB.id,
                    storagePathB: photoB.storage_path,
                    dateB: photoB.date
                })
            })
            const data = await res.json()
            if (data.analysis) {
                setAnalysis(data.analysis)
            }
        } catch (e) {
            console.error('Comparison Analysis failed', e)
        } finally {
            setAnalyzing(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20 p-4 md:p-8">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8">
                <Link
                    href="/dashboard/photos"
                    className="inline-flex items-center text-slate-400 hover:text-slate-600 mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Gallery
                </Link>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                            Transformation
                        </h1>
                        <p className="text-slate-500 mt-2">
                            Comparing {photoA && new Date(photoA.date).toLocaleDateString()} with {photoB && new Date(photoB.date).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Comparison Grid */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">

                {/* Photo A (Before) */}
                {photoA && (
                    <div className="relative group rounded-3xl overflow-hidden shadow-xl bg-white aspect-[3/4] md:aspect-[4/5]">
                        <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-bold border border-white/10 shadow-lg">
                            BEFORE • {new Date(photoA.date).toLocaleDateString()}
                        </div>
                        <img
                            src={photoA.publicUrl}
                            alt="Start"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {photoA.notes && (
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-20">
                                <p className="text-white/90 text-sm line-clamp-2">{photoA.notes}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Photo B (After) */}
                {photoB && (
                    <div className="relative group rounded-3xl overflow-hidden shadow-2xl bg-white ring-4 ring-purple-500/10 aspect-[3/4] md:aspect-[4/5]">
                        <div className="absolute top-4 left-4 z-10 bg-purple-600 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-purple-900/20 flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-purple-200" />
                            AFTER • {new Date(photoB.date).toLocaleDateString()}
                        </div>
                        <img
                            src={photoB.publicUrl}
                            alt="Current"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {photoB.notes && (
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-20">
                                <p className="text-white/90 text-sm line-clamp-2">{photoB.notes}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Analysis & Actions */}
            <div className="max-w-3xl mx-auto">
                {!analysis ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <button
                            onClick={handleAnalyze}
                            disabled={analyzing}
                            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-slate-900 text-white font-bold text-lg shadow-xl shadow-slate-900/20 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30 transition-all disabled:opacity-70 disabled:scale-100 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <span className="relative flex items-center gap-2">
                                {analyzing ? <RefreshCw className="animate-spin w-5 h-5" /> : <Zap className="w-5 h-5 fill-yellow-400 text-yellow-400" />}
                                {analyzing ? 'Analysis in Progress...' : 'Analyze Transformation'}
                            </span>
                        </button>
                        <p className="mt-4 text-slate-400 text-sm flex items-center gap-2">
                            <Sparkles className="w-3 h-3" />
                            Powered by Gemini Vision AI
                        </p>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-2xl border border-white/50 ring-1 ring-slate-200">
                            <div className="flex justify-between items-start mb-8 border-b border-slate-100 pb-6">
                                <div>
                                    <div className="text-purple-600 font-bold tracking-wider text-xs uppercase mb-2">AI Assessment</div>
                                    <h2 className="text-2xl font-bold text-slate-900 leading-tight">Transformation Insights</h2>
                                </div>
                                <button
                                    onClick={() => setAnalysis(null)}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                                    title="Reset Analysis"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-600 prose-li:text-slate-600 prose-strong:text-purple-700">
                                <ReactMarkdown>{analysis}</ReactMarkdown>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center text-slate-400 text-sm">
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Analysis generated based on visible physical changes
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
