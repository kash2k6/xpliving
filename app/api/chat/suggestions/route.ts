import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { aiResponse, selectedProduct } = await request.json();

    if (!aiResponse || typeof aiResponse !== 'string') {
      return NextResponse.json(
        { error: 'AI response is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Generate suggested follow-up questions based on the AI response
    const prompt = `Based on this AI response about a product, generate exactly 4 short, actionable follow-up questions that would help a potential customer make a purchasing decision. 

CRITICAL REQUIREMENTS:
- Questions MUST be positive and encouraging toward purchase
- NEVER ask about negative aspects, side effects, problems, or reasons NOT to buy
- Focus ONLY on benefits, usage, results, comparisons with alternatives, or how to use the product
- Questions should help customers feel confident about purchasing
- Short and conversational (max 8-10 words each)
- Relevant to the content mentioned in the response

EXAMPLES OF GOOD QUESTIONS:
- "How do I use this product?"
- "What are the main benefits?"
- "How long until I see results?"
- "Can I take it with other supplements?"
- "What makes this better than alternatives?"

EXAMPLES OF BAD QUESTIONS (NEVER GENERATE THESE):
- "Are there any side effects?"
- "What are the risks?"
- "Why shouldn't I buy this?"
- "What problems does this have?"

AI Response:
"${aiResponse}"

Return ONLY a JSON array of exactly 4 question strings, nothing else. Example format: ["Question 1?", "Question 2?", "Question 3?", "Question 4?"]`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates positive, encouraging follow-up questions to help customers make purchasing decisions. NEVER generate questions about negative aspects, side effects, risks, or reasons not to buy. Focus only on benefits, usage, results, and positive aspects. Always return a valid JSON array of strings.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const responseText = completion.choices[0]?.message?.content || '[]';
    
    // Parse the JSON response
    let suggestions: string[] = [];
    try {
      // Remove any markdown code blocks if present
      const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      suggestions = JSON.parse(cleanedText);
      
      // Ensure it's an array and limit to 4 questions
      if (!Array.isArray(suggestions)) {
        suggestions = [];
      }
      suggestions = suggestions.slice(0, 4);
    } catch (error) {
      console.error('Error parsing suggestions:', error);
      // Fallback to default suggestions (positive, purchase-encouraging only)
      suggestions = [
        'How do I use this product?',
        'What are the main benefits?',
        'How long until I see results?',
        'Can I take it with other supplements?',
      ];
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

