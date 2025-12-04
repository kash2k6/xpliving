import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    'OpenAI-Beta': 'assistants=v2',
  },
});

interface UserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

async function getAssistant() {
  const assistantId = process.env.OPENAI_ASSISTANT_ID;
  
  if (!assistantId) {
    throw new Error('OPENAI_ASSISTANT_ID not configured');
  }

  try {
    const assistant = await openai.beta.assistants.retrieve(assistantId);
    return assistant;
  } catch (error) {
    throw new Error(`Assistant not found: ${assistantId}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { messages, selectedProduct, threadId: clientThreadId, userData } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get or create thread
    let threadId = clientThreadId;
    if (!threadId) {
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
    }

    // Get the latest user message
    const userMessages = messages.filter((msg: { role: string; content: string }) => msg.role === 'user');
    const userMessage = userMessages[userMessages.length - 1]?.content || '';
    
    if (!userMessage) {
      return new Response(
        JSON.stringify({ error: 'User message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const assistant = await getAssistant();
    
    // Add user message to thread
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: userMessage,
    });

    // Build personalization context
    let personalizationContext = '';
    if (userData) {
      const nameParts: string[] = [];
      if (userData.firstName) nameParts.push(userData.firstName);
      if (userData.lastName) nameParts.push(userData.lastName);
      const fullName = nameParts.length > 0 ? nameParts.join(' ') : undefined;
      
      if (fullName) {
        personalizationContext += `The user's name is ${fullName}. Use their name naturally in conversation to create a personalized experience. `;
      }
      if (userData.email) {
        personalizationContext += `The user's email is ${userData.email}. `;
      }
      if (userData.phone) {
        personalizationContext += `The user's phone number is ${userData.phone}. `;
      }
    }

    // Build additional instructions based on selected product
    const productInstructions = selectedProduct 
      ? `The user has selected ${selectedProduct === 'youth' ? 'Xperience Youth (Volumex Liquid)' : 'Roman Xperience'}. Focus your responses on this specific product. Use the knowledge base to provide detailed information about this product.`
      : 'The user has not yet selected a specific product. You can discuss both products or help them choose. Use the knowledge base to provide accurate information about both products.';

    const additionalInstructions = [
      personalizationContext,
      productInstructions,
    ].filter(Boolean).join('\n\n');

    // Create a streaming run
    const stream = await openai.beta.threads.runs.stream(threadId, {
      assistant_id: assistant.id,
      additional_instructions: additionalInstructions,
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          let fullText = '';
          
          for await (const event of stream) {
            if (event.event === 'thread.message.delta') {
              const delta = event.data.delta;
              if (delta.content && delta.content[0]?.type === 'text' && delta.content[0].text?.value) {
                const text = delta.content[0].text.value;
                fullText += text;
                // Send the chunk
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: text, done: false })}\n\n`));
              }
            } else if (event.event === 'thread.run.completed') {
              // Send final message with thread ID
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: '', done: true, threadId: threadId })}\n\n`));
              controller.close();
            } else if (event.event === 'thread.run.failed') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Run failed', done: true })}\n\n`));
              controller.close();
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Streaming failed', done: true })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to get AI response' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

