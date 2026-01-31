import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { body_part, size_value, unit, date } = body;

        // Validation
        if (!body_part || !size_value) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('body_measurements')
            .insert({
                user_id: user.id,
                body_part,
                size_value,
                unit: unit || 'inch',
                date: date || new Date().toISOString().split('T')[0]
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error saving measurement:', error);
        return NextResponse.json({ error: 'Failed to save measurement' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;

        const { data, error } = await supabase
            .from('body_measurements')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching measurements:', error);
        return NextResponse.json({ error: 'Failed to fetch measurements' }, { status: 500 });
    }
}
