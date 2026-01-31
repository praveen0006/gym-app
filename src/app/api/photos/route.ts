import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

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
        const { storage_path, date, notes } = body

        if (!storage_path) {
            return NextResponse.json({ error: 'Missing storage_path' }, { status: 400 })
        }

        // Validate date format if provided
        if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD.' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('progress_photos')
            .insert({
                user_id: user.id,
                storage_path,
                date: date || new Date().toISOString().split('T')[0],
                notes: notes || ''
            })
            .select()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Return first result (insert returns array)
        return NextResponse.json(data?.[0] || data)
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

    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 })
        }

        // 1. Get the file path first
        const { data: photo, error: fetchError } = await supabase
            .from('progress_photos')
            .select('storage_path')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (fetchError || !photo) {
            return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
        }

        // 2. Delete from Storage
        const { error: storageError } = await supabase.storage
            .from('progress-photos')
            .remove([photo.storage_path])

        if (storageError) {
            console.error("Storage delete error", storageError)
            // Continue to delete from DB anyway to correct state
        }

        // 3. Delete from DB
        const { error: dbError } = await supabase
            .from('progress_photos')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (dbError) {
            return NextResponse.json({ error: dbError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
