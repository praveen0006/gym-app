export default function Loading() {
    return (
        <div className="space-y-8 p-6">
            <div className="flex flex-col gap-1">
                <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
                <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Skeleton Cards */}
                {[1, 2, 3].map((i) => (
                    <div key={i} className="min-h-[200px] rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 h-5 w-1/3 animate-pulse rounded bg-slate-100" />
                        <div className="h-20 w-3/4 animate-pulse rounded-lg bg-slate-100" />
                    </div>
                ))}
            </div>
        </div>
    )
}
