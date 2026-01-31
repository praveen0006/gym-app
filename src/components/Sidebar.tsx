'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Activity,
    Utensils,
    Camera,
    Scale,
    Calendar,
    LogOut,
    Dumbbell
} from 'lucide-react'
import clsx from 'clsx'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Workouts', href: '/dashboard/workouts', icon: Dumbbell },
    { name: 'Schedule', href: '/dashboard/schedule', icon: Calendar },
    { name: 'Nutrition', href: '/dashboard/nutrition', icon: Utensils },
    { name: 'Photos', href: '/dashboard/photos', icon: Camera },
    { name: 'Weight', href: '/dashboard/weight', icon: Scale },
]

interface SidebarProps {
    onClose?: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
    const pathname = usePathname()

    return (
        <div className="flex h-screen w-full flex-col border-r border-slate-200 bg-white shadow-sm md:w-64">
            <div className="flex h-16 items-center px-6">
                <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2 font-bold text-xl text-slate-800 transition-opacity hover:opacity-80">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                        <Activity size={20} />
                    </div>
                    <span>FitBot</span>
                </Link>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={onClose}
                            className={clsx(
                                'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            )}
                        >
                            <item.icon
                                className={clsx(
                                    'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                                    isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                                )}
                            />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            <div className="border-t border-slate-200 p-4">
                <form action="/api/auth/signout" method="POST">
                    <button
                        type="submit"
                        className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                        <LogOut className="mr-3 h-5 w-5 text-slate-400 transition-colors group-hover:text-red-600" />
                        Sign out
                    </button>
                </form>
            </div>
        </div>
    )
}
