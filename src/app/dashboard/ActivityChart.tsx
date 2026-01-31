'use client'

export default function ActivityChart({ data }: { data: any[] }) {
    if (!data || data.length === 0) return null

    const maxSteps = Math.max(...data.map(d => d.steps), 1000)

    return (
        <div className="flex h-40 items-end gap-3 pt-4">
            {data.slice().reverse().map((day) => {
                const height = (day.steps / maxSteps) * 100
                const dateLabel = new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })
                return (
                    <div key={day.date} className="flex h-full flex-1 flex-col items-center gap-2 group">
                        <div className="relative flex w-full flex-1 items-end overflow-hidden rounded-t-lg bg-slate-100">
                            <div
                                className="w-full rounded-t-lg bg-blue-500 transition-all duration-500 group-hover:bg-blue-600"
                                style={{
                                    height: `${height}%`,
                                    minHeight: '4px'
                                }}
                                title={`${day.steps} steps`}
                            />
                        </div>
                        <span className="text-xs font-medium text-slate-500">{dateLabel}</span>
                    </div>
                )
            })}
        </div>
    )
}
