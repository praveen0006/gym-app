import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import MobileHeader from '@/components/MobileHeader'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Desktop Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 bg-white shadow-sm hidden md:block">
                <Sidebar />
            </aside>

            {/* Mobile Header (Top) */}
            <MobileHeader />

            {/* Main Content */}
            <div className="flex flex-1 flex-col md:pl-64">
                {/* Add top padding for Mobile Header, but none for Desktop */}
                <main className="flex-1 p-4 pt-20 md:p-8 md:pt-8 pb-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
