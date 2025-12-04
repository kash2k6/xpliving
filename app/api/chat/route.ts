import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    'OpenAI-Beta': 'assistants=v2',
  },
});

// Get assistant - expects OPENAI_ASSISTANT_ID to be set in environment
async function getAssistant() {
  const assistantId = process.env.OPENAI_ASSISTANT_ID;
  
  if (!assistantId) {
    throw new Error('OPENAI_ASSISTANT_ID not configured. Please create an assistant in OpenAI Dashboard and add the ID to your .env.local file.');
  }

  try {
    const assistant = await openai.beta.assistants.retrieve(assistantId);
    return assistant;
  } catch (error) {
    throw new Error(`Assistant not found. Please check that OPENAI_ASSISTANT_ID=${assistantId} is correct in your .env.local file.`);
  }
}

interface UserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

// Get assistant response using thread
async function getAssistantResponse(
  threadId: string, 
  userMessage: string, 
  selectedProduct: string | null,
  userData?: UserData
) {
  const assistant = await getAssistant();
  
  // Add user message to thread
  await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: userMessage,
  });

  // Build personalization context (without name usage instruction)
  let personalizationContext = '';
  if (userData) {
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

  // Run the assistant
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistant.id,
    additional_instructions: additionalInstructions,
  });

  // Poll for completion
  let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
  let attempts = 0;
  const maxAttempts = 60; // 60 seconds max wait

  while (
    (runStatus.status === 'queued' || runStatus.status === 'in_progress') &&
    attempts < maxAttempts
  ) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    attempts++;
  }

  // Check if run completed successfully
  if (runStatus.status === 'completed') {
    // Get the latest messages
    const messages = await openai.beta.threads.messages.list(threadId, {
      limit: 1,
      order: 'desc',
    });
    
    const message = messages.data[0];
    if (message.content[0].type === 'text') {
      return message.content[0].text.value;
    }
    return 'I received your message, but there was an issue processing the response.';
  } else if (runStatus.status === 'failed') {
    console.error('Run failed:', runStatus.last_error);
    throw new Error(runStatus.last_error?.message || 'Assistant run failed');
  } else {
    throw new Error(`Assistant run status: ${runStatus.status}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { messages, selectedProduct, threadId: clientThreadId, userData } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Get or create thread
    let threadId = clientThreadId;
    if (!threadId) {
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
    }

    // Get the latest user message (filter out assistant messages)
    const userMessages = messages.filter((msg: { role: string; content: string }) => msg.role === 'user');
    const userMessage = userMessages[userMessages.length - 1]?.content || '';
    
    if (!userMessage) {
      return NextResponse.json(
        { error: 'User message is required' },
        { status: 400 }
      );
    }

    // Get assistant response
    const response = await getAssistantResponse(threadId, userMessage, selectedProduct, userData);
    
    return NextResponse.json({ 
      message: response,
      threadId: threadId // Return thread ID to client for future messages
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get AI response' },
      { status: 500 }
    );
  }
}
