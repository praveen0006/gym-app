'use client'

import { useEffect, useRef } from 'react'

/**
 * This component triggers an automatic sync with Google Fit
 * when the dashboard loads. It uses a ref to ensure it only
 * runs once per mount.
 */
export default function AutoSyncWrapper({ children }: { children: React.ReactNode }) {
    const hasSynced = useRef(false)

    useEffect(() => {
        if (hasSynced.current) return
        hasSynced.current = true

        // Delay sync by 2 seconds to allow UI to render first
        const timer = setTimeout(async () => {
            try {
                console.log('[AutoSync] Triggering automatic sync...')
                const res = await fetch('/api/fit/sync', { method: 'POST' })
                if (res.ok) {
                    console.log('[AutoSync] Sync completed successfully.')
                    // Refresh the page to show updated data
                    window.location.reload()
                } else {
                    console.warn('[AutoSync] Sync returned non-OK status:', res.status)
                }
            } catch (err) {
                console.error('[AutoSync] Sync failed:', err)
            }
        }, 2000)

        return () => clearTimeout(timer)
    }, [])

    return <>{children}</>
}
