import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// Validate environment variable
if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set');
}

export async function POST(req: Request) {
    try {
        const { photoId, storagePath, photoIdB, storagePathB, dateA, dateB } = await req.json()

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Helper to download and process image
        const processImage = async (path: string) => {
            const { data: fileData, error } = await supabase.storage
                .from('progress-photos')
                .download(path)
            if (error || !fileData) throw new Error('Download failed for ' + path)
            const arrayBuffer = await fileData.arrayBuffer()
            const base64 = Buffer.from(arrayBuffer).toString('base64')
            const mime = fileData.type || 'image/jpeg'
            return `data:${mime};base64,${base64}`
        }

        // Prepare System Prompt
        const SYSTEM_PROMPT = `You are an elite physique coach and biomechanics expert. 
        Your task is to provide a HIGHLY DETAILED, PRECISE, and CLINICAL analysis of progress photos.
        Avoid generic advice. Focus on visual metrics, muscle insertion visibility, body fat distribution, and structural balance.
        Output MUST be valid JSON only.`

        let userPrompt = ''
        let imageUrls = []
        let mode = 'single'

        // ---------------------------------------------------------
        // MODE 1: COMPARISON (Two Photos)
        // ---------------------------------------------------------
        if (photoId && photoIdB) {
            mode = 'comparison'
            const [urlA, urlB] = await Promise.all([
                processImage(storagePath),
                processImage(storagePathB)
            ])
            imageUrls.push(urlA, urlB)

            userPrompt = `Compare these two progress photos of the same person.
            Photo 1 (Old) Date: ${dateA || 'Start'}
            Photo 2 (New) Date: ${dateB || 'Current'}

            Provide a DETAILED COMPARATIVE REPORT in JSON format.
            Focus on:
            1. **Body Fat**: Analyze changes in waist, abs, and face.
            2. **Muscle**: specific growth in chest, arms, legs.
            3. **Verdict**: The overall result phase.

            Return JSON format:
            {
               "title": "A catchy title for the transformation",
               "body_fat_change": "Detailed paragraph about body fat changes...",
               "muscle_development": "Detailed paragraph about muscle changes...",
               "structural_balance": "Notes on posture/symmetry...",
               "verdict": "Final verdict summary..."
            }`
        } else {
            // ---------------------------------------------------------
            // MODE 2: SINGLE PHOTO ANALYSIS
            // ---------------------------------------------------------
            mode = 'single'
            const dataUrl = await processImage(storagePath)
            imageUrls.push(dataUrl)

            userPrompt = `Perform a comprehensive physique analysis on this photo.
             Return JSON format:
             {
                "observations": ["Detailed observation 1", "Detailed observation 2"],
                "muscle_groups": ["Strong Point 1", "Strong Point 2"],
                "estimated_body_fat": "Precise % Range (e.g. 14-16%)",
                "advice": "One specific actionable tip."
             }`
        }

        // Construct OpenRouter Request
        const messages = [
            {
                role: 'system',
                content: SYSTEM_PROMPT
            },
            {
                role: 'user',
                content: [
                    { type: 'text', text: userPrompt },
                    ...imageUrls.map(url => ({
                        type: 'image_url',
                        image_url: { url }
                    }))
                ]
            }
        ]

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "google/gemini-2.0-flash-001", // Excellent vision, fast, cheap/free on OpenRouter
                "messages": messages,
                "response_format": { "type": "json_object" }
            })
        });

        if (!response.ok) {
            const errText = await response.text()
            throw new Error(`OpenRouter API Error: ${response.statusText}`)
        }

        const data = await response.json()
        const content = data.choices[0].message.content || '{}'
        let parsedContent = JSON.parse(content)

        // For comparison, we reconstruct the markdown from JSON fields
        if (mode === 'comparison') {
            const markdownReport = `
# ${parsedContent.title || 'Transformation Analysis'}

## 1. Body Fat & Definition
${parsedContent.body_fat_change || 'No data generated.'}

## 2. Muscular Development
${parsedContent.muscle_development || 'No data generated.'}

## 3. Structural Balance
${parsedContent.structural_balance || 'No specific notes.'}

### 🏆 Verdict
**${parsedContent.verdict || 'Analysis Inconclusive'}**`.trim()

            return NextResponse.json({ success: true, analysis: markdownReport })
        }

        // For single, we save to DB and return structured object
        // 4. Save to Database
        const { error: updateError } = await supabase
            .from('progress_photos')
            .update({ ai_analysis: content }) // Save raw JSON string
            .eq('id', photoId)
            .eq('user_id', user.id)

        if (updateError) console.error('Update error:', updateError)

        return NextResponse.json({ success: true, analysis: parsedContent })

    } catch (e: any) {
        console.error('Analysis failed:', e)
        return NextResponse.json({ error: e.message || 'Unknown error' }, { status: 500 })
    }
}
