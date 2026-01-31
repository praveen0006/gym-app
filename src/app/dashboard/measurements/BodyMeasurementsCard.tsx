'use client';

import { useState, useEffect } from 'react';
import { Ruler, Plus, X, Save, History } from 'lucide-react';

interface Measurement {
    id: string;
    body_part: string;
    size_value: number;
    unit: string;
    date: string;
}

const COMMON_PARTS = [
    'Biceps (Left)', 'Biceps (Right)',
    'Chest',
    'Waist',
    'Hips',
    'Thigh (Left)', 'Thigh (Right)',
    'Calves',
    'Shoulders',
    'Neck',
    'Weight'
];

export default function BodyMeasurementsCard() {
    const [measurements, setMeasurements] = useState<Measurement[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // Form State
    const [selectedPart, setSelectedPart] = useState(COMMON_PARTS[0]);
    const [customPart, setCustomPart] = useState('');
    const [sizeValue, setSizeValue] = useState('');
    const [unit, setUnit] = useState('inches');
    const [saving, setSaving] = useState(false);

    const fetchMeasurements = async () => {
        try {
            const res = await fetch('/api/measurements');
            if (res.ok) {
                const data = await res.json();
                setMeasurements(data);
            }
        } catch (error) {
            console.error('Failed to load measurements', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMeasurements();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const partToSave = selectedPart === 'Custom' ? customPart : selectedPart;

        try {
            const res = await fetch('/api/measurements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    body_part: partToSave,
                    size_value: parseFloat(sizeValue),
                    unit,
                    date: new Date().toISOString().split('T')[0]
                })
            });

            if (res.ok) {
                await fetchMeasurements();
                setIsAdding(false);
                setSizeValue('');
                setCustomPart('');
            }
        } catch (error) {
            console.error('Failed to save', error);
        } finally {
            setSaving(false);
        }
    };

    // Group by latest per part
    const latestMeasurements = measurements.reduce((acc, curr) => {
        if (!acc[curr.body_part]) {
            acc[curr.body_part] = curr;
        }
        return acc;
    }, {} as Record<string, Measurement>);

    if (loading) return <div className="animate-pulse h-64 bg-slate-100 rounded-xl"></div>;

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <Ruler size={20} />
                    </div>
                    <h3 className="font-semibold text-slate-900">Body Measurements</h3>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                    <Plus size={16} />
                    Log
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSave} className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-start mb-4">
                        <h4 className="text-sm font-semibold text-slate-700">Log Measurement</h4>
                        <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="flex flex-col gap-4 mb-4">
                        <div className="w-full">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Part</label>
                            <select
                                value={selectedPart}
                                onChange={(e) => setSelectedPart(e.target.value)}
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                {COMMON_PARTS.map(p => <option key={p} value={p}>{p}</option>)}
                                <option value="Custom">Custom...</option>
                            </select>
                        </div>

                        {selectedPart === 'Custom' && (
                            <div className="w-full">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Custom Name</label>
                                <input
                                    type="text"
                                    value={customPart}
                                    onChange={(e) => setCustomPart(e.target.value)}
                                    placeholder="e.g. Forearms"
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                        )}

                        <div className="w-full">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Size</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={sizeValue}
                                    onChange={(e) => setSizeValue(e.target.value)}
                                    placeholder="0.0"
                                    className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    required
                                />
                                <select
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                    className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm bg-slate-50 text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="inches">in</option>
                                    <option value="cm">cm</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save size={16} />}
                        Save Measurement
                    </button>
                </form>
            )}

            {Object.keys(latestMeasurements).length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                    No measurements logged yet.
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {Object.values(latestMeasurements).map((m) => (
                        <div key={m.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 group">
                            <div className="text-xs text-slate-500 mb-1 truncate" title={m.body_part}>{m.body_part}</div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg font-bold text-slate-700">{m.size_value}</span>
                                <span className="text-xs font-medium text-slate-400">{m.unit}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 opacity-60">
                                {new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
