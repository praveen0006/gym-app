'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
export default function SyncButton() {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const router = useRouter()

    const handleSync = async () => {
        setLoading(true)
        setMessage('Syncing...')

        try {
            const res = await fetch('/api/fit/sync', { method: 'POST' })
            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Sync failed')
            }

            setMessage(`Synced! Records: ${data.count || 0}`)
            router.refresh()

            // Clear message after 3 seconds
            setTimeout(() => setMessage(''), 3000)
        } catch (e: any) {
            setMessage(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center gap-4">
            <button
                onClick={handleSync}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                {loading ? (
                    <>
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                        Syncing...
                    </>
                ) : (
                    <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
                        </svg>
                        Sync Now
                    </>
                )}
            </button>
            {message && (
                <span className={`text-sm animate-in fade-in slide-in-from-left-2 duration-300 ${message.includes('failed') ? 'text-red-400' : 'text-slate-400'}`}>
                    {message}
                </span>
            )}
        </div>
    )
}

