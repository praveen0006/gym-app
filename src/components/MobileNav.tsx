'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Utensils, Camera, Scale, MoreHorizontal } from 'lucide-react'
import clsx from 'clsx'

const mobileNavItems = [
    { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Food', href: '/dashboard/nutrition', icon: Utensils },
    { name: 'Photos', href: '/dashboard/photos', icon: Camera },
    { name: 'Weight', href: '/dashboard/weight', icon: Scale },
]

export default function MobileNav() {
    const pathname = usePathname()

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white pb-safe shadow-[0_-1px_3px_rgba(0,0,0,0.05)] md:hidden">
            <nav className="flex h-16 items-center justify-around px-2">
                {mobileNavItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={clsx(
                                'flex flex-1 flex-col items-center justify-center gap-1.5 py-2 text-[10px] font-medium transition-colors',
                                isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                            )}
                        >
                            <item.icon
                                size={22}
                                strokeWidth={isActive ? 2.5 : 2}
                                className={clsx('transition-transform', isActive && 'scale-110')}
                            />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
