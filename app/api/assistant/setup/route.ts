import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Setup endpoint to create assistant and upload knowledge base files
 * 
 * Usage:
 * 1. POST to /api/assistant/setup with files to create assistant and upload files
 * 2. GET /api/assistant/setup to retrieve existing assistant info
 */

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Upload files to OpenAI
    const uploadedFiles = [];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileBlob = new Blob([buffer], { type: file.type });
      
      const uploadFormData = new FormData();
      uploadFormData.append('file', fileBlob, file.name);
      uploadFormData.append('purpose', 'assistants');

      const uploadResponse = await fetch('https://api.openai.com/v1/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(`Failed to upload file ${file.name}: ${error.error?.message || JSON.stringify(error)}`);
      }

      const uploadedFile = await uploadResponse.json();
      uploadedFiles.push(uploadedFile);
    }

    // Check if assistant already exists
    let assistantId: string | undefined = process.env.OPENAI_ASSISTANT_ID;
    let assistant;

    if (assistantId) {
      try {
        assistant = await openai.beta.assistants.retrieve(assistantId);
        
        // Create or get vector store for new files
        const vectorStore = await (openai.beta as any).vectorStores.create({
          name: 'Xperience Living Knowledge Base',
          file_ids: uploadedFiles.map(f => f.id),
        });

        // Update assistant with new vector store
        assistant = await openai.beta.assistants.update(assistantId, {
          tool_resources: {
            file_search: {
              vector_store_ids: [vectorStore.id],
            },
          },
        });
      } catch (error) {
        console.log('Assistant not found or error updating, creating new one:', error);
        assistantId = undefined;
      }
    }

    if (!assistantId) {
      // Create vector store for files
      const vectorStore = await (openai.beta as any).vectorStores.create({
        name: 'Xperience Living Knowledge Base',
        file_ids: uploadedFiles.map(f => f.id),
      });

      // Create new assistant
      assistant = await openai.beta.assistants.create({
        name: 'Xperience Living Product Assistant',
        instructions: `You are a helpful AI assistant for Xperience Living, specializing in product recommendations and information about our products.

Your role:
- Provide accurate information about products based on the knowledge base
- Answer questions about product features, benefits, usage, and ingredients
- Make personalized recommendations based on user needs
- Be friendly, professional, and informative
- Always include appropriate disclaimers when discussing health benefits
- If the user has selected a product, focus on that specific product
- Use the knowledge base files to provide detailed, accurate information

Important: Always include FDA disclaimers when discussing health benefits or claims.`,
        model: 'gpt-4o',
        tools: [{ type: 'file_search' }],
        tool_resources: {
          file_search: {
            vector_store_ids: [vectorStore.id],
          },
        },
      });
    }

    // Ensure assistant is defined
    if (!assistant) {
      return NextResponse.json(
        { error: 'Failed to create or retrieve assistant' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      assistantId: assistant.id,
      message: 'Assistant created/updated successfully',
      files: uploadedFiles.map(f => ({
        id: f.id,
        name: f.filename,
        status: f.status,
      })),
      instructions: `Add this to your .env.local:\nOPENAI_ASSISTANT_ID=${assistant.id}`,
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to setup assistant' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const assistantId = process.env.OPENAI_ASSISTANT_ID;
    if (!assistantId) {
      return NextResponse.json({
        assistantId: null,
        message: 'No assistant configured. Use POST to create one.',
      });
    }

    const assistant = await openai.beta.assistants.retrieve(assistantId);
    
    return NextResponse.json({
      assistantId: assistant.id,
      name: assistant.name,
      model: assistant.model,
      tools: assistant.tools,
      createdAt: assistant.created_at,
    });
  } catch (error) {
    console.error('Get assistant error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get assistant' },
      { status: 500 }
    );
  }
}

