import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new Response('Unauthorized', { status: 401 });
        }

        // Fetch Health Context
        const today = new Date().toISOString().split('T')[0];
        const { data: activity } = await supabase
            .from('daily_activity')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .maybeSingle();

        // Fetch Nutrition Context
        const { data: nutritionLogs } = await supabase
            .from('nutrition_logs')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today);

        // Calculate nutrition totals
        const nutritionTotals = nutritionLogs?.reduce((acc, item) => ({
            calories: acc.calories + (item.calories || 0),
            protein: acc.protein + (item.protein_g || 0),
            carbs: acc.carbs + (item.carbs_g || 0),
            fats: acc.fats + (item.fats_g || 0),
            meals: acc.meals + 1
        }), { calories: 0, protein: 0, carbs: 0, fats: 0, meals: 0 });

        // Build context
        let contextPart = '';
        if (activity) {
            contextPart += `Activity: ${activity.steps || 0} steps, ${Math.round(activity.calories || 0)} calories burned, ${activity.heart_minutes || 0} heart points. `;
        }
        if (nutritionTotals && nutritionTotals.meals > 0) {
            contextPart += `Nutrition today: ${nutritionTotals.calories} cal consumed, ${Math.round(nutritionTotals.protein)}g protein, ${Math.round(nutritionTotals.carbs)}g carbs, ${Math.round(nutritionTotals.fats)}g fats (${nutritionTotals.meals} meals logged).`;
        }
        if (!contextPart) {
            contextPart = 'No activity or nutrition data synced for today.';
        }

        const systemMessage = `You are a friendly AI Health Coach. Give personalized, encouraging health and nutrition advice.
Keep responses concise (2-3 sentences). Use emojis sparingly.
User Context: ${contextPart}`;

        // Sanitize messages
        const sanitizedMessages = messages.map((m: { role: string; content: string }) => ({
            role: m.role as 'user' | 'assistant',
            content: String(m.content)
        }));

        // Add system message
        const allMessages = [
            { role: 'system', content: systemMessage },
            ...sanitizedMessages
        ];

        // Helper for local fallback
        const getLocalResponse = () => {
            let text = "👋 I'm your local Health Coach! ";
            if (activity) {
                const steps = activity.steps || 0;
                if (steps >= 10000) text += `Amazing ${steps.toLocaleString()} steps! 🔥 `;
                else if (steps >= 5000) text += `Good progress with ${steps.toLocaleString()} steps! 💪 `;
                else text += `${steps.toLocaleString()} steps so far. Keep moving! 🚶 `;
            }
            if (nutritionTotals && nutritionTotals.meals > 0) {
                text += `You've had ${nutritionTotals.calories} calories today with ${Math.round(nutritionTotals.protein)}g protein. `;
                if (nutritionTotals.protein >= 100) text += "Great protein intake! 💪";
                else text += "Try to add more protein-rich foods!";
            } else if (!activity) {
                text += "Sync with Google Fit and log your meals to get personalized advice!";
            }
            return new Response(text, { headers: { 'Content-Type': 'text/plain' } });
        };

        // Try OpenRouter first
        if (process.env.OPENROUTER_API_KEY) {
            try {
                console.log('Calling OpenRouter...');
                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
                    },
                    body: JSON.stringify({
                        model: 'google/gemini-2.0-flash-001',
                        messages: allMessages,
                        stream: true,
                    }),
                });

                if (!response.ok) {
                    const error = await response.text();
                    console.error('OpenRouter Error:', error);
                    throw new Error(error);
                }

                // Stream the response
                return new Response(response.body, {
                    headers: {
                        'Content-Type': 'text/event-stream',
                        'Cache-Control': 'no-cache',
                        'Connection': 'keep-alive',
                    },
                });
            } catch (error) {
                console.error('OpenRouter failed:', error);
            }
        }

        // Try Groq as backup
        if (process.env.GROQ_API_KEY) {
            try {
                console.log('Calling Groq...');
                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'llama-3.3-70b-versatile',
                        messages: allMessages,
                        stream: true,
                    }),
                });

                if (!response.ok) {
                    const error = await response.text();
                    console.error('Groq Error:', error);
                    throw new Error(error);
                }

                return new Response(response.body, {
                    headers: {
                        'Content-Type': 'text/event-stream',
                        'Cache-Control': 'no-cache',
                    },
                });
            } catch (error) {
                console.error('Groq failed:', error);
            }
        }

        // Final fallback
        return getLocalResponse();

    } catch (error) {
        console.error('Chat API Error:', error);
        return new Response('Something went wrong.', { status: 500 });
    }
}
