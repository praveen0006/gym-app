'use client'

import { useEffect } from 'react'
export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <h2 className="text-2xl font-bold mb-4 text-red-500">Something went wrong!</h2>
            <p className="text-slate-400 mb-8 max-w-[400px] leading-relaxed">
                We ran into an issue loading your dashboard data. This might be a temporary connection glitch.
            </p>
            <button
                onClick={() => reset()}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
            >
                Try again
            </button>
        </div>
    )
}
