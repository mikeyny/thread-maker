import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request) {
  try {
    const { text, prompt, threadContext } = await request.json()

    const systemPrompt = `You are an expert social media specialist helping to improve tweet content.
Your task is to ${prompt.toLowerCase()} while maintaining the core message.
Consider the context of the entire thread when making suggestions.
Provide 3 distinct variations that are engaging and appropriate for Twitter.
Each suggestion must be under 280 characters.
Return ONLY a JSON array of objects with 'text' and 'score' properties.
The score should reflect how well the suggestion meets the prompt criteria (0.0 to 1.0).`

    const userPrompt = `Thread context: ${threadContext}
Selected text to improve: "${text}"

Remember to return only a JSON array of objects with 'text' and 'score' properties.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    })

    const response = completion.choices[0].message.content
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    const suggestions = JSON.parse(response).suggestions || []
    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Error in suggestions API:', error)
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    )
  }
} 