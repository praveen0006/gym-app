import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data)
}

export async function POST(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { date, meal_type, item_name, calories, protein_g, carbs_g, fats_g, fiber_g, quantity, unit, serving_weight_g } = body

        if (!item_name || !calories) {
            return NextResponse.json({ error: 'Name and Calories are required' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('nutrition_logs')
            .insert({
                user_id: user.id,
                date: date || new Date().toISOString().split('T')[0],
                meal_type,
                item_name,
                calories: parseInt(calories),
                protein_g: protein_g ? parseFloat(protein_g) : null,
                carbs_g: carbs_g ? parseFloat(carbs_g) : null,
                fats_g: fats_g ? parseFloat(fats_g) : null,
                fiber_g: fiber_g ? parseFloat(fiber_g) : null,
                quantity: quantity ? parseFloat(quantity) : 1,
                unit: unit || 'serving',
                serving_weight_g: serving_weight_g ? parseFloat(serving_weight_g) : null
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    const { error } = await supabase
        .from('nutrition_logs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
}
