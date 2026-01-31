import { NextResponse } from 'next/server'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'

const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
})

export async function POST(req: Request) {
    try {
        const { food_name } = await req.json()

        if (!food_name || food_name.trim() === '') {
            return NextResponse.json({ error: 'Food name is required' }, { status: 400 })
        }

        const prompt = `You are a nutrition database. For the food item "${food_name}", return ONLY a JSON object with estimated nutritional values for a typical serving size.
Also include "serving_weight_g" which is the estimated weight of that serving in grams.
Also include "fiber_g" (dietary fiber).
No explanation, no markdown, just valid JSON.

Example format:
{"calories":300,"protein_g":12,"carbs_g":45,"fats_g":8,"fiber_g":4,"serving_weight_g":150}

If you don't know the exact values, provide reasonable estimates for a typical serving. Return ONLY the JSON object, nothing else.`

        const { text } = await generateText({
            model: groq('llama-3.3-70b-versatile'),
            prompt,
        })


        // Parse the response - it should be pure JSON
        let nutrition
        try {
            // Clean any potential markdown or whitespace
            const cleanedText = text.trim().replace(/```json\n?|\n?```/g, '')
            nutrition = JSON.parse(cleanedText)
        } catch (parseError) {
            console.error('Failed to parse nutrition JSON:', text)
            // Return default values if parsing fails
            nutrition = { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0, fiber_g: 0, serving_weight_g: 0 }
        }

        return NextResponse.json({
            food_name,
            calories: nutrition.calories || 0,
            protein_g: nutrition.protein_g || 0,
            carbs_g: nutrition.carbs_g || 0,
            fats_g: nutrition.fats_g || 0,
            fiber_g: nutrition.fiber_g || 0,
            serving_weight_g: nutrition.serving_weight_g || 0
        })

    } catch (e: any) {
        console.error('Nutrition lookup error:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
