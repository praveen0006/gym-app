'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Search, Zap, ChevronDown, Flame, Utensils } from 'lucide-react'
import NutritionChatWindow from './NutritionChatWindow'

export default function NutritionPage() {
    const [logs, setLogs] = useState<any[]>([])
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [loading, setLoading] = useState(true)

    // Form State
    const [mealType, setMealType] = useState('Breakfast')
    const [itemName, setItemName] = useState('')
    const [calories, setCalories] = useState('')
    const [protein, setProtein] = useState('')
    const [carbs, setCarbs] = useState('')
    const [fats, setFats] = useState('')
    const [fiber, setFiber] = useState('')
    const [quantity, setQuantity] = useState(1)
    const [unit, setUnit] = useState('serving') // serving, g, ml
    const [baseNutrition, setBaseNutrition] = useState<any>(null)
    const [submitting, setSubmitting] = useState(false)
    const [lookingUp, setLookingUp] = useState(false)

    useEffect(() => {
        fetchLogs()
    }, [date])

    const fetchLogs = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/nutrition?date=${date}`)
            const data = await res.json()
            if (Array.isArray(data)) {
                setLogs(data)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    // AI-powered nutrition lookup
    const handleFoodLookup = async () => {
        if (!itemName.trim() || lookingUp) return

        setLookingUp(true)
        try {
            const res = await fetch('/api/nutrition/lookup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ food_name: itemName })
            })

            if (res.ok) {
                const data = await res.json()
                setBaseNutrition(data)
                // Reset to default on new lookup
                setQuantity(1)
                setUnit('serving')
                setCalories(data.calories?.toString() || '')
                setProtein(data.protein_g?.toString() || '')
                setCarbs(data.carbs_g?.toString() || '')
                setFats(data.fats_g?.toString() || '')
                setFiber(data.fiber_g?.toString() || '')
            }
        } catch (e) {
            console.error('Lookup failed:', e)
        } finally {
            setLookingUp(false)
        }
    }

    const calculateNutrition = (qty: number, u: string) => {
        if (!baseNutrition) return

        let multiplier = qty

        // If unit is weight/volume (g/ml) and we have a serving weight
        if ((u === 'g' || u === 'ml') && baseNutrition.serving_weight_g) {
            multiplier = qty / baseNutrition.serving_weight_g
        }

        setCalories(Math.round(baseNutrition.calories * multiplier).toString())
        setProtein(baseNutrition.protein_g ? (baseNutrition.protein_g * multiplier).toFixed(1) : '')
        setCarbs(baseNutrition.carbs_g ? (baseNutrition.carbs_g * multiplier).toFixed(1) : '')
        setFats(baseNutrition.fats_g ? (baseNutrition.fats_g * multiplier).toFixed(1) : '')
        setFiber(baseNutrition.fiber_g ? (baseNutrition.fiber_g * multiplier).toFixed(1) : '')
    }

    const handleQuantityChange = (newQty: number) => {
        setQuantity(newQty)
        calculateNutrition(newQty, unit)
    }

    const handleUnitChange = (newUnit: string) => {
        setUnit(newUnit)
        // If switching to g/ml, default to serving weight if available, else 100
        if ((newUnit === 'g' || newUnit === 'ml') && unit === 'serving') {
            const defaultWeight = baseNutrition?.serving_weight_g || 100
            setQuantity(defaultWeight)
            calculateNutrition(defaultWeight, newUnit)
        }
        // If switching back to serving, default to 1
        else if (newUnit === 'serving' && (unit === 'g' || unit === 'ml')) {
            setQuantity(1)
            calculateNutrition(1, newUnit)
        } else {
            calculateNutrition(quantity, newUnit)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            const res = await fetch('/api/nutrition', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date,
                    meal_type: mealType,
                    item_name: itemName,
                    calories,
                    protein_g: protein,
                    carbs_g: carbs,
                    fats_g: fats,
                    fiber_g: fiber,
                    quantity,
                    unit,
                    serving_weight_g: baseNutrition?.serving_weight_g
                })
            })

            if (res.ok) {
                fetchLogs()
                // Reset form
                setItemName('')
                setCalories('')
                setProtein('')
                setCarbs('')
                setFats('')
                setFiber('')
                setQuantity(1)
                setUnit('serving')
                setBaseNutrition(null)
            }
        } catch (e) {
            alert('Failed to add log')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this item?')) return
        try {
            const res = await fetch(`/api/nutrition?id=${id}`, { method: 'DELETE' })
            if (res.ok) {
                setLogs(prev => prev.filter(l => l.id !== id))
            }
        } catch (e) {
            console.error(e)
        }
    }

    // Totals (calculate these before return)
    const totalCalories = logs.reduce((sum: number, item: any) => sum + item.calories, 0)
    const totalProtein = logs.reduce((sum: number, item: any) => sum + (item.protein_g || 0), 0)
    const totalCarbs = logs.reduce((sum: number, item: any) => sum + (item.carbs_g || 0), 0)
    const totalFats = logs.reduce((sum: number, item: any) => sum + (item.fats_g || 0), 0)
    const totalFiber = logs.reduce((sum: number, item: any) => sum + (item.fiber_g || 0), 0)

    // Group by meal
    const groupedLogs = logs.reduce((acc: Record<string, any[]>, item: any) => {
        if (!acc[item.meal_type]) acc[item.meal_type] = []
        acc[item.meal_type].push(item)
        return acc
    }, {} as Record<string, any[]>)

    const mealOrder = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

    const nutritionData = {
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFats,
        meals: logs.map(l => ({ meal_type: l.meal_type, item_name: l.item_name, calories: l.calories }))
    }

    return (
        <div className="mx-auto max-w-5xl space-y-8">
            {/* ... existing UI ... */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Nutrition Tracker</h1>
                    <p className="text-slate-500">Fuel your body right.</p>
                </div>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-600 focus:border-blue-500 focus:outline-none"
                />
            </div>

            {/* Daily Summary Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-500">
                        <Flame size={16} className="text-orange-500" />
                        Calories
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{totalCalories}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-1 text-sm font-medium text-slate-500">Protein</div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-slate-900">{totalProtein.toFixed(0)}</span>
                        <span className="text-sm text-slate-400">g</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full bg-blue-500" style={{ width: '60%' }} />
                    </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-1 text-sm font-medium text-slate-500">Carbs</div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-slate-900">{totalCarbs.toFixed(0)}</span>
                        <span className="text-sm text-slate-400">g</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full bg-emerald-500" style={{ width: '40%' }} />
                    </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-1 text-sm font-medium text-slate-500">Fats</div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-slate-900">{totalFats.toFixed(0)}</span>
                        <span className="text-sm text-slate-400">g</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full bg-amber-500" style={{ width: '30%' }} />
                    </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-1 text-sm font-medium text-slate-500">Fiber</div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-slate-900">{totalFiber.toFixed(0)}</span>
                        <span className="text-sm text-slate-400">g</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full bg-indigo-500" style={{ width: '30%' }} />
                    </div>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Add Food Form */}
                <div className="lg:col-span-1">
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
                            <Plus size={20} className="text-blue-600" />
                            Add Food
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Meal Type</label>
                                <div className="relative">
                                    <select
                                        value={mealType}
                                        onChange={e => setMealType(e.target.value)}
                                        className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        {mealOrder.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3 top-3 text-slate-400" size={16} />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 flex items-center justify-between text-sm font-medium text-slate-700">
                                    Food Name
                                    {lookingUp && (
                                        <span className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                                            <Zap size={12} className="fill-blue-600" /> AI Lookup...
                                        </span>
                                    )}
                                </label>
                                <div className="relative">
                                    <input
                                        value={itemName}
                                        onChange={e => setItemName(e.target.value)}
                                        onBlur={handleFoodLookup}
                                        placeholder="e.g. Oatmeal"
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 pl-10 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                    />
                                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                                </div>
                                <p className="mt-1 text-xs text-slate-500">Type a food and press tab for auto-nutrition.</p>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Quantity</label>
                                <input
                                    type="number"
                                    min="0.1"
                                    step="0.1"
                                    value={quantity}
                                    onChange={e => handleQuantityChange(parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Unit</label>
                                <div className="relative">
                                    <select
                                        value={unit}
                                        onChange={e => handleUnitChange(e.target.value)}
                                        className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="serving">Serving</option>
                                        <option value="g">Grams (g)</option>
                                        <option value="ml">Milliliters (ml)</option>
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3 top-3 text-slate-400" size={16} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Calories</label>
                                    <input
                                        type="number"
                                        value={calories}
                                        onChange={e => setCalories(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Protein (g)</label>
                                    <input
                                        type="number"
                                        value={protein}
                                        onChange={e => setProtein(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Carbs (g)</label>
                                    <input
                                        type="number"
                                        value={carbs}
                                        onChange={e => setCarbs(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Fats (g)</label>
                                    <input
                                        type="number"
                                        value={fats}
                                        onChange={e => setFats(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Fiber (g)</label>
                                    <input
                                        type="number"
                                        value={fiber}
                                        onChange={e => setFiber(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none"
                                    />
                                </div>

                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full rounded-lg bg-slate-900 py-3 font-semibold text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md disabled:opacity-70"
                            >
                                {submitting ? 'Adding...' : 'Log Food'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Food Log List */}
                <div className="lg:col-span-2">
                    <div className="space-y-6">
                        {mealOrder.map(meal => {
                            const items = groupedLogs[meal] || []
                            if (items.length === 0) return null

                            const mealCals = items.reduce((sum: number, i: any) => sum + i.calories, 0)

                            return (
                                <div key={meal} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                                    <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/50 px-6 py-3">
                                        <h3 className="font-semibold text-slate-900">{meal}</h3>
                                        <div className="text-sm font-medium text-slate-500">{mealCals} kcal</div>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {items.map((item: any) => (
                                            <div key={item.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors">
                                                <div>
                                                    <div className="font-medium text-slate-900">
                                                        {item.item_name}
                                                        <span className="ml-2 text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                                            {item.quantity} {item.unit === 'serving' ? (item.quantity > 1 ? 'servings' : 'serving') : item.unit}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 flex gap-3 text-xs text-slate-500">
                                                        <span className="font-medium text-blue-600">P: {item.protein_g}g</span>
                                                        <span className="font-medium text-emerald-600">C: {item.carbs_g}g</span>
                                                        <span className="font-medium text-amber-600">F: {item.fats_g}g</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="font-bold text-slate-700">{item.calories}</div>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="rounded-full p-2 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}

                        {logs.length === 0 && (
                            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
                                <div className="mb-4 rounded-full bg-white p-4 shadow-sm">
                                    <Utensils size={32} className="text-slate-400" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900">No food logged today</h3>
                                <p className="text-slate-500">Start by adding your breakfast!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* AI Nutrition Coach Chat */}
            <NutritionChatWindow nutritionData={nutritionData} />
        </div>
    )
}
