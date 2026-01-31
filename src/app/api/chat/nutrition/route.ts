import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
    try {
        const { messages, nutritionContext } = await req.json();

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new Response('Unauthorized', { status: 401 });
        }

        // Build System Prompt
        let contextPart = '';
        if (nutritionContext) {
            contextPart = `User's Today Nutrition:
- Calories: ${nutritionContext.totalCalories} kcal
- Protein: ${nutritionContext.totalProtein.toFixed(1)}g
- Carbs: ${nutritionContext.totalCarbs.toFixed(1)}g
- Fats: ${nutritionContext.totalFats.toFixed(1)}g
- Meals Logged: ${nutritionContext.meals.length}`;
        } else {
            contextPart = "User has not logged any food today.";
        }

        const systemMessage = `You are an expert AI Nutritionist. Your goal is to help the user achieve their diet goals (weight loss, muscle gain, or maintenance).
Context:
${contextPart}

Instructions:
1. Analyze their current stats (Protein/Carbs/Fats).
2. Give specific food suggestions if they are low on a macro.
3. Keep responses encouraging but direct.
4. Keep responses concise (under 3 sentences unless asked for a meal plan).`;

        // Sanitize messages
        const sanitizedMessages = messages.map((m: { role: string; content: string }) => ({
            role: m.role as 'user' | 'assistant',
            content: String(m.content)
        }));

        const allMessages = [
            { role: 'system', content: systemMessage },
            ...sanitizedMessages
        ];

        // 1. Try OpenRouter (Gemini)
        if (process.env.OPENROUTER_API_KEY) {
            try {
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

                if (response.ok) {
                    return new Response(response.body, {
                        headers: {
                            'Content-Type': 'text/event-stream',
                            'Cache-Control': 'no-cache',
                            'Connection': 'keep-alive',
                        },
                    });
                }
            } catch (e) {
                console.error('OpenRouter Nutrition Chat failed', e);
            }
        }

        // 2. Try Groq (Llama)
        if (process.env.GROQ_API_KEY) {
            try {
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

                if (response.ok) {
                    return new Response(response.body, {
                        headers: {
                            'Content-Type': 'text/event-stream',
                            'Cache-Control': 'no-cache',
                        },
                    });
                }
            } catch (e) {
                console.error('Groq Nutrition Chat failed', e);
            }
        }

        // 3. Local Fallback
        let fallbackText = "I'm your local Nutrition Assistant. ";
        if (nutritionContext && nutritionContext.totalCalories > 0) {
            fallbackText += `You've eaten ${nutritionContext.totalCalories} calories today. `;
            if (nutritionContext.totalProtein < 50) fallbackText += "Try adding more protein like chicken, eggs, or beans! 🍗";
            else fallbackText += "Your protein intake looks solid! 💪";
        } else {
            fallbackText += "Log some meals so I can give you advice!";
        }

        return new Response(fallbackText, { headers: { 'Content-Type': 'text/plain' } });

    } catch (error) {
        console.error('Nutrition Chat API Error:', error);
        return new Response('Error processing request', { status: 500 });
    }
}
