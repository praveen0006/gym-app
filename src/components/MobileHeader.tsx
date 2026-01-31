'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, ChevronLeft, X, Activity } from 'lucide-react'
import Sidebar from './Sidebar'

export default function MobileHeader() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const pathname = usePathname()
    const router = useRouter()

    const isDashboardRoot = pathname === '/dashboard'

    return (
        <>
            {/* Top Header */}
            <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 h-16 px-4 flex items-center justify-between md:hidden shadow-sm">

                {/* Left: Menu OR Back */}
                <div className="flex items-center min-w-[40px]">
                    {!isDashboardRoot ? (
                        <button
                            onClick={() => router.back()}
                            className="p-2 -ml-2 text-slate-600 hover:text-slate-900 transition-colors"
                            aria-label="Go back"
                        >
                            <ChevronLeft size={24} />
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 text-slate-600 hover:text-slate-900 transition-colors"
                            aria-label="Open menu"
                        >
                            <Menu size={24} />
                        </button>
                    )}
                </div>

                {/* Center: Brand Logo */}
                <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-slate-800">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
                        <Activity size={16} />
                    </div>
                    <span>FitBot</span>
                </Link>

                {/* Right: Hamburger (if back button is shown on left, show menu here? Or just keep it simple) 
                    User asked for menu visibility. Let's keep menu on left if on root, back if on sub-page.
                    Actually, we should probably allow accessing the menu EVEN on sub-pages if they want.
                    But standard generic pattern: Back replaces Menu on subpages, or Menu moves to right.
                    
                    Let's put Menu on Right ALWAYS if we want full access everywhere.
                    BUT user said: "try to add a sidebar... all sections should be visible"
                    
                    Proposed Layout: [Back (conditionally)] [Logo] [Menu]
                    If Back is hidden, Logo can slide left or stay center.
                */}
                <div className="flex items-center justify-end min-w-[40px]">
                    {/* Right side empty to balance logo centering */}
                </div>
            </header>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setIsSidebarOpen(false)}
                    />

                    {/* Drawer */}
                    <div className="relative w-72 h-full bg-white shadow-xl animate-in slide-in-from-left duration-200">
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 z-10"
                        >
                            <X size={20} />
                        </button>

                        {/* Reuse existing Sidebar component */}
                        <Sidebar onClose={() => setIsSidebarOpen(false)} />
                    </div>
                </div>
            )}

            {/* Spacer for fixed header */}
            <div className="h-16 md:hidden" />
        </>
    )
}
