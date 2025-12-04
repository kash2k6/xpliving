# Knowledge Base Setup Guide

## Current Implementation

We're currently using **System Prompt with Hardcoded Knowledge** - this is the simplest approach and works well for small, static product information.

### How It Works:
- Product knowledge is stored as strings in the API route
- Included in the system prompt sent to OpenAI
- Works well for 2-3 products with basic info
- No file uploads or external storage needed

## When to Upgrade

### Option 1: Keep Current Approach (Recommended for now)
**Use when:**
- Small knowledge base (< 10 products)
- Static information that doesn't change often
- Simple product descriptions

**Pros:**
- Simple, no setup needed
- Fast responses
- No additional costs
- Easy to update (just edit code)

**Cons:**
- Limited to small knowledge bases
- Hard to manage large amounts of text
- Not ideal for frequently changing content

### Option 2: OpenAI Assistants API
**Use when:**
- Medium knowledge base (10-100 products)
- Want to upload files (PDFs, docs, etc.)
- Need better organization

**Setup Steps:**
1. Create an Assistant in OpenAI Dashboard
2. Upload knowledge base files (PDF, TXT, etc.)
3. Enable "Retrieval" tool
4. Use Assistant API instead of Chat Completions

**Pros:**
- Can upload files (PDFs, documents)
- Better for larger knowledge bases
- OpenAI handles retrieval automatically
- Can update files without code changes

**Cons:**
- More complex setup
- Requires file management
- Slightly slower (file retrieval step)
- Additional API costs

### Option 3: Vector Database + RAG (Advanced)
**Use when:**
- Very large knowledge base (100+ products)
- Need real-time updates
- Want custom retrieval logic

**Setup:**
- Use vector DB (Pinecone, Weaviate, etc.)
- Embed documents
- Retrieve relevant chunks based on query

**Pros:**
- Most scalable
- Real-time updates
- Custom retrieval logic
- Best for large knowledge bases

**Cons:**
- Most complex setup
- Requires vector database service
- More expensive
- Overkill for small projects

## Recommendation

For your current use case (2 products), **keep the current system prompt approach**. It's:
- Simple and works well
- Fast and cost-effective
- Easy to maintain

If you plan to:
- Add many more products (10+)
- Upload detailed product PDFs
- Frequently update product info

Then consider upgrading to **OpenAI Assistants API**.

## How to Switch to Assistants API

1. Create assistant in OpenAI Dashboard or via API
2. Upload your product knowledge files
3. Uncomment the Assistants API code in `app/api/chat/route.ts`
4. Update environment variables:
   ```
   OPENAI_ASSISTANT_ID=asst_xxxxx
   ```
5. Update client to handle thread IDs

## Current Knowledge Base Structure

The knowledge base is currently in `app/api/chat/route.ts`:

```typescript
const PRODUCT_KNOWLEDGE = {
  youth: `...product info...`,
  roman: `...product info...`,
};
```

To update product info, just edit these strings in the file.

