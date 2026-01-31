import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Define date range (Last 7 days)
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    const fromDate = sevenDaysAgo.toISOString().split('T')[0];

    try {
        // 1. Fetch Activity Data (Steps & Heart Points)
        const { data: activity } = await supabase
            .from('daily_activity')
            .select('steps, heart_minutes, date')
            .eq('user_id', user.id)
            .gte('date', fromDate);

        console.log("Health Score Debug: Fetched Activity", activity);

        // 2. Fetch Consistency Data (Count logs)
        const { count: weightCount } = await supabase
            .from('weight_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('date', fromDate);

        const { count: photoCount } = await supabase
            .from('progress_photos')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('date', fromDate);

        // --- SCORING ALGORITHM ---

        // A. Activity Score (Max 60)
        // Goal: 10,000 steps/day * 7 = 70,000 steps/week
        // Goal: 150 Heart Points/week
        const totalSteps = activity?.reduce((sum, day) => sum + (day.steps || 0), 0) || 0;
        const totalHeartPoints = activity?.reduce((sum, day) => sum + (day.heart_minutes || 0), 0) || 0;

        const stepScore = Math.min(40, (totalSteps / 70000) * 40); // Max 40
        const heartScore = Math.min(20, (totalHeartPoints / 150) * 20); // Max 20
        const activityScore = stepScore + heartScore;

        // B. Consistency Score (Max 20)
        // Weight: 3+ logs = 10pts, 1-2 logs = 5pts
        // Photos: 1+ log = 10pts
        let consistencyScore = 0;
        const wCount = weightCount || 0;
        if (wCount >= 3) consistencyScore += 10;
        else if (wCount >= 1) consistencyScore += 5;

        const pCount = photoCount || 0;
        if (pCount >= 1) consistencyScore += 10;

        // C. Trend/Bonus Score (Max 20)
        // Current simple logic: If activity > 0, give small bonus. 
        // Real trend requiring comparing previous week is complex, so we simplify for V1:
        // Bonus for hitting DAILY step goal at least 3 times.
        const daysHittingGoal = activity?.filter(d => (d.steps || 0) >= 8000).length || 0; // Soft goal 8k
        let trendScore = 0;
        if (daysHittingGoal >= 3) trendScore += 10;
        if (daysHittingGoal >= 5) trendScore += 10; // Extra bonus for consistency

        // Total Calculation
        const totalScore = Math.min(100, Math.round(activityScore + consistencyScore + trendScore));

        return NextResponse.json({
            score: totalScore,
            breakdown: {
                activity: Math.round(activityScore),
                consistency: Math.round(consistencyScore),
                trend: Math.round(trendScore)
            },
            metrics: {
                totalSteps,
                totalHeartPoints,
                weightLogs: wCount,
                photoLogs: pCount
            },
            tips: generateTips(activityScore, consistencyScore)
        });

    } catch (error) {
        console.error("Health Score Error:", error);
        return NextResponse.json({ error: 'Failed to calculate score' }, { status: 500 });
    }
}

function generateTips(accScore: number, conScore: number): string[] {
    const tips = [];
    if (accScore < 30) tips.push("Try to increase your daily steps to boost your score.");
    if (conScore < 10) tips.push("Log your weight at least 3 times a week for consistency points.");
    if (accScore > 50 && conScore > 15) tips.push("You're crushing it! Keep up the momentum.");
    return tips.length > 0 ? tips : ["Great start! Keep moving to see your score rise."];
}
