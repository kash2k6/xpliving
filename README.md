# Xperience Living

A clean, ChatGPT-style product recommendation page with AI chat integration and Whop checkout.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file with your API keys:
```
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_ASSISTANT_ID=asst_xxxxx  # Will be created automatically on first run
WHOP_API_KEY=your_whop_api_key_here  # Required for checkout configuration and upsells
WHOP_COMPANY_ID=biz_xxxxxxxxxxxxx  # Your Whop company ID (found in dashboard URL)
NEXT_PUBLIC_WHOP_PLAN_ID_YOUTH=plan_x3WmiSOReZ9yc
NEXT_PUBLIC_WHOP_PLAN_ID_ROMAN=plan_yl6F67ovs2E19
```
Note: 
- `OPENAI_ASSISTANT_ID` will be created automatically - check server logs for the ID
- `WHOP_API_KEY` is required - get it from your Whop Developer Dashboard > Company API Keys
- `WHOP_COMPANY_ID` is required - it's in your dashboard URL (biz_xxxxx) or in your company settings
- Plan IDs are set as defaults in the code, but you can override them with environment variables
- You can also use `NEXT_PUBLIC_WHOP_PLAN_ID` as a fallback for both products if you only have one plan ID

3. Upload your product knowledge base files (see `ASSISTANT_SETUP.md` for details):
   - Create detailed product information files (TXT, PDF, DOCX)
   - Upload via API endpoint or OpenAI Dashboard
   - See `ASSISTANT_SETUP.md` for complete instructions

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- AI-powered chat interface using OpenAI GPT-4o
- Product knowledge base for Volumex Liquid – Youth Xperience
- Whop checkout integration via modal
- Responsive design with Tailwind CSS
- Clean, minimal ChatGPT-style UI

## Project Structure

- `app/page.tsx` - Main page component
- `components/XperienceLivingPage.tsx` - Main chat interface component
- `components/CheckoutModal.tsx` - Whop checkout modal
- `app/api/chat/route.ts` - OpenAI API integration endpoint

