'use client';

import { useState, useEffect } from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface HealthData {
    score: number;
    breakdown: {
        activity: number;
        consistency: number;
        trend: number;
    };
    tips: string[];
}

export default function HealthScoreCard() {
    const [data, setData] = useState<HealthData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchScore = async () => {
            try {
                const res = await fetch('/api/health-score');
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (err) {
                console.error("Failed to load health score", err);
            } finally {
                setLoading(false);
            }
        };
        fetchScore();
    }, []);

    if (loading) return (
        <div className="flex h-[300px] items-center justify-center rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-slate-400">
            <span className="animate-pulse">Loading Score...</span>
        </div>
    );

    if (!data) return null;

    const chartData = [
        { name: 'Score', value: data.score, fill: getScoreColor(data.score) }
    ];

    return (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col h-full">
            <div className="mb-6 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Weekly Health Score</h3>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600 ring-1 ring-emerald-100">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                    </span>
                    Live
                </span>
            </div>

            <div className="flex flex-col items-center gap-6 flex-1">
                {/* Radial Chart */}
                <div className="relative h-[180px] w-[180px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            innerRadius="80%"
                            outerRadius="100%"
                            barSize={15}
                            data={chartData}
                            startAngle={90}
                            endAngle={-270}
                        >
                            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                            <RadialBar
                                background
                                dataKey="value"
                                cornerRadius={30 / 2}
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                        <div className="text-4xl font-bold leading-none transition-colors duration-500" style={{ color: getScoreColor(data.score) }}>
                            {data.score}
                        </div>
                        <div className="text-xs text-slate-400 font-medium">/ 100</div>
                    </div>
                </div>

                {/* Legend / Breakdown */}
                <div className="w-full space-y-4">
                    <div>
                        <div className="mb-2 flex justify-between text-sm">
                            <span className="flex items-center gap-2 text-slate-600 font-medium">
                                <span className="text-lg">🏃</span> Activity
                            </span>
                            <span className="font-bold text-slate-900">{data.breakdown.activity}/60</span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-blue-500 transition-all duration-1000 ease-out"
                                style={{ width: `${(data.breakdown.activity / 60) * 100}%` }}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="mb-2 flex justify-between text-sm">
                            <span className="flex items-center gap-2 text-slate-600 font-medium">
                                <span className="text-lg">📅</span> Consistency
                            </span>
                            <span className="font-bold text-slate-900">{data.breakdown.consistency}/20</span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-emerald-500 transition-all duration-1000 ease-out"
                                style={{ width: `${(data.breakdown.consistency / 20) * 100}%` }}
                            />
                        </div>
                    </div>

                    {data.tips[0] && (
                        <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm italic text-blue-700 border border-blue-100">
                            "{data.tips[0]}"
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function getScoreColor(score: number) {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 50) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
}
