import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const userId = user.id;
        console.log(`[DELETE] Starting data cleanup for user: ${userId}`);

        // 1. Delete Storage Files (Photos)
        // First list files to delete them one by one (storage doesn't support bulk delete by folder easily usually, but let's try listed)
        const { data: files, error: listError } = await supabase.storage.from('progress-photos').list(userId);
        if (listError) {
            console.error("Storage list error:", listError);
            // Continue with DB deletion even if listing fails
        }
        if (files && Array.isArray(files) && files.length > 0) {
            const pathsToDelete = files
                .filter(f => f && f.name) // Filter out null/undefined entries
                .map(f => `${userId}/${f.name}`);
            
            if (pathsToDelete.length > 0) {
                const { error: storageError } = await supabase.storage.from('progress-photos').remove(pathsToDelete);
                if (storageError) {
                    console.error("Storage delete error:", storageError);
                    // Continue with DB deletion even if storage deletion fails
                }
            }
        }

        // 2. Delete Database Records
        // We run these in sequence to ensure proper error handling
        const { error: activityError } = await supabase.from('daily_activity').delete().eq('user_id', userId);
        if (activityError) {
            console.error("Failed to delete daily_activity:", activityError);
            return NextResponse.json({ error: 'Failed to delete activity data' }, { status: 500 });
        }

        const { error: weightError } = await supabase.from('weight_logs').delete().eq('user_id', userId);
        if (weightError) {
            console.error("Failed to delete weight_logs:", weightError);
            return NextResponse.json({ error: 'Failed to delete weight data' }, { status: 500 });
        }

        const { error: goalsError } = await supabase.from('user_goals').delete().eq('user_id', userId);
        if (goalsError) {
            console.error("Failed to delete user_goals:", goalsError);
            return NextResponse.json({ error: 'Failed to delete goals data' }, { status: 500 });
        }

        const { error: integrationsError } = await supabase.from('integrations').delete().eq('user_id', userId);
        if (integrationsError) {
            console.error("Failed to delete integrations:", integrationsError);
            return NextResponse.json({ error: 'Failed to delete integrations data' }, { status: 500 });
        }

        const { error: photosError } = await supabase.from('progress_photos').delete().eq('user_id', userId);
        if (photosError) {
            console.error("Failed to delete progress_photos:", photosError);
            return NextResponse.json({ error: 'Failed to delete photos data' }, { status: 500 });
        }

        console.log(`[DELETE] Data cleanup complete for user: ${userId}`);

        // 3. Sign Out (Handled by frontend usually, but good to know backend is done)
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Delete Account Error:", error);
        return NextResponse.json({ error: 'Failed to delete data' }, { status: 500 });
    }
}
