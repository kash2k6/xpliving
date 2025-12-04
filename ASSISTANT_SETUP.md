# OpenAI Assistants API Setup Guide

## Quick Setup (Recommended)

Since you're creating the assistant manually in OpenAI Dashboard, this is the easiest approach:

### 1. Create Assistant in OpenAI Dashboard

1. Go to https://platform.openai.com/assistants
2. Click "Create" button
3. Configure your assistant:
   - **Name**: "Xperience Living Product Assistant"
   - **Instructions**: 
     ```
     You are a helpful AI assistant for Xperience Living, specializing in product recommendations and information about our products.

     Your role:
     - Provide accurate information about products based on the knowledge base
     - Answer questions about product features, benefits, usage, and ingredients
     - Make personalized recommendations based on user needs
     - Be friendly, professional, and informative
     - Always include appropriate disclaimers when discussing health benefits
     - If the user has selected a product, focus on that specific product
     - Use the knowledge base files to provide detailed, accurate information

     Important: Always include FDA disclaimers when discussing health benefits or claims.
     ```
   - **Model**: `gpt-4o`
   - **Tools**: Enable "File search" (this enables knowledge base)

4. Click "Save"

### 2. Upload Knowledge Base Files

1. In your assistant, go to the "Knowledge" section
2. Click "Upload files" or drag and drop files
3. Upload your product knowledge files:
   - `product-youth.txt` or `product-youth.pdf`
   - `product-roman.txt` or `product-roman.pdf`
   - Any other product documentation

**Supported file types:**
- `.txt` - Plain text files
- `.pdf` - PDF documents
- `.docx` - Word documents
- `.md` - Markdown files

4. Wait for files to process (you'll see a checkmark when ready)

### 3. Get Assistant ID

1. After creating the assistant, you'll see the Assistant ID in the URL or details
2. It looks like: `asst_xxxxxxxxxxxxx`
3. Copy this ID

### 4. Add to Environment Variables

Add to your `.env.local` file:

```env
OPENAI_API_KEY=sk-xxxxx
OPENAI_ASSISTANT_ID=asst_xxxxxxxxxxxxx
```

### 5. Restart Your Server

```bash
npm run dev
```

That's it! Your assistant is now ready to use.

## Knowledge Base File Examples

### Example: `product-youth.txt`

```
XPERIENCE YOUTH (VOLUMEX LIQUID)

Product Overview:
Xperience Youth, also known as Volumex Liquid, is a fast-acting botanical supplement designed to support performance and vitality.

Key Ingredients:
- Botanical extract blend
- Rapid absorption formula
- Natural performance enhancers

Benefits:
- Fast-acting support for performance
- Enhanced vitality
- Quick absorption for immediate effects

Usage Instructions:
Take 1-2 servings daily as directed. Best taken on an empty stomach for optimal absorption.

Target Audience:
Ideal for individuals seeking quick-acting support for performance and vitality.

Scientific Backing:
[Add any research, studies, or scientific information]

FAQs:
Q: How quickly does it work?
A: The liquid form allows for rapid absorption, with effects typically noticed within 30-60 minutes.

Q: Can I take it with other supplements?
A: Consult with your healthcare provider before combining with other supplements.

Important Disclaimers:
These statements have not been evaluated by the FDA. This product is not intended to diagnose, treat, cure, or prevent any disease.
```

### Example: `product-roman.txt`

```
ROMAN XPERIENCE

Product Overview:
Roman Xperience is a premium formula designed to support overall wellness and performance through a comprehensive approach.

Key Ingredients:
- Premium botanical blend
- High-quality extracts
- Comprehensive wellness formula

Benefits:
- Long-term wellness support
- Comprehensive performance enhancement
- Premium quality assurance

Usage Instructions:
Take as directed on the label. For best results, maintain consistent daily use.

Target Audience:
Ideal for those seeking a premium, comprehensive approach to wellness and performance.

[Add more detailed information...]

Important Disclaimers:
These statements have not been evaluated by the FDA. This product is not intended to diagnose, treat, cure, or prevent any disease.
```

## Updating Knowledge Base

To add or update product information:

1. Go to your assistant in OpenAI Dashboard
2. Go to "Knowledge" section
3. Remove old files if needed
4. Upload new/updated files
5. Files will automatically be processed and available

No code changes needed! Just update files in the dashboard.

## How It Works

1. **User asks question** → Sent to Assistants API with thread ID
2. **Assistant searches** → Searches through your uploaded knowledge base files
3. **Retrieves information** → Finds relevant details from your files
4. **Provides answer** → Gives detailed response based on your knowledge base

## Troubleshooting

### "Assistant not found" error
- Check that `OPENAI_ASSISTANT_ID` is correct in `.env.local`
- Verify the assistant exists in your OpenAI Dashboard
- Make sure you're using the correct OpenAI account

### Files not being used
- Ensure files are uploaded to the assistant in OpenAI Dashboard
- Check that "File search" tool is enabled
- Wait for files to finish processing (checkmark appears)
- Files must be in the assistant's knowledge base, not just uploaded to your account

### Slow responses
- Assistants API can be slower than Chat Completions (this is normal)
- It's searching through your knowledge base files
- Consider optimizing file size if responses are too slow

## Benefits of Manual Setup

✅ Easy to add/remove files without code changes  
✅ Visual interface in OpenAI Dashboard  
✅ Can update files anytime  
✅ No need to manage file uploads in code  
✅ Better for managing multiple files  
