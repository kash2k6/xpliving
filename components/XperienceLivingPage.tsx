'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProductImageGallery from './ProductImageGallery';
import Footer from './Footer';
import { trackFacebookEvent } from './FacebookPixel';
import UserDataForm from './UserDataForm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  productCard?: {
    productId: 'youth' | 'roman';
    name: string;
    subtitle: string;
  };
  suggestions?: string[];
}

type ProductType = 'youth' | 'roman' | null;

interface Product {
  id: ProductType;
  name: string;
  subtitle: string;
  planId: string;
}

const SUGGESTED_PROMPTS = [
  { text: 'Tell me about the products', icon: '💊' },
  { text: 'What are the benefits?', icon: '✨' },
  { text: 'How does it work?', icon: '🔬' },
];

const ROTATING_MESSAGES = [
  "Need help getting stronger?",
  "Need help feeling firmer?",
  "Need a natural solution?",
  "Looking for premium results?",
  "Want to enhance your experience?",
];

const PRODUCTS: Record<'youth' | 'roman', Omit<Product, 'planId'>> = {
  youth: {
    id: 'youth',
    name: 'Xperience Youth',
    subtitle: 'Liquid Formula',
  },
  roman: {
    id: 'roman',
    name: 'Roman Xperience',
    subtitle: 'Premium Formula',
  },
};

const PRODUCT_PRICES = {
  youth: '$44.95',
  roman: '$59.95',
};

const getProductPlanId = (productId: 'youth' | 'roman'): string => {
  if (productId === 'youth') {
    return process.env.NEXT_PUBLIC_WHOP_PLAN_ID_YOUTH 
      || process.env.NEXT_PUBLIC_WHOP_PLAN_ID 
      || 'plan_x3WmiSOReZ9yc'; // Xperience Youth default
  }
  return process.env.NEXT_PUBLIC_WHOP_PLAN_ID_ROMAN
    || process.env.NEXT_PUBLIC_WHOP_PLAN_ID
    || 'plan_yl6F67ovs2E19'; // Roman Xperience default
};


interface UserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export default function XperienceLivingPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductType>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
  const [showUserDataForm, setShowUserDataForm] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [pendingProductContext, setPendingProductContext] = useState<ProductType>(null);
  const [showProductCards, setShowProductCards] = useState(false); // Hidden by default on mobile
  const [rotatingMessageIndex, setRotatingMessageIndex] = useState(0);
  const [formShownAfterResponses, setFormShownAfterResponses] = useState(false);
  const [userData, setUserData] = useState<UserData>(() => {
    // Load from localStorage on mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('xperience_user_data');
      const data = stored ? JSON.parse(stored) : {};
      // Check if we have required data (firstName, lastName, email)
      const hasRequiredData = data.firstName && data.lastName && data.email;
      return hasRequiredData ? data : {};
    }
    return {};
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper to check if mobile and conditionally focus
  const focusInputIfNotMobile = () => {
    // Only focus on desktop (screen width > 768px)
    if (typeof window !== 'undefined' && window.innerWidth > 768) {
      inputRef.current?.focus();
    }
  };

  // Helper function to handle streaming responses
  const handleStreamingResponse = async (
    response: Response,
    newMessages: Message[],
    assistantMessageIndex: number,
    productContext?: ProductType,
    receivedThreadId?: string | null
  ) => {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let currentThreadId = receivedThreadId || threadId;

    if (!reader) {
      throw new Error('No response body');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.error) {
              throw new Error(data.error);
            }

            if (data.content) {
              fullContent += data.content;
              // Update the assistant message with streaming content
              setMessages(prev => {
                const updated = [...prev];
                if (updated[assistantMessageIndex]) {
                  updated[assistantMessageIndex] = {
                    role: 'assistant',
                    content: fullContent,
                  };
                }
                return updated;
              });
            }

            if (data.done) {
              if (data.threadId) {
                currentThreadId = data.threadId;
                setThreadId(data.threadId);
              }
              
              // Generate suggested questions based on full AI response
              let suggestions: string[] = [];
              try {
                const suggestionsResponse = await fetch('/api/chat/suggestions', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    aiResponse: fullContent,
                    selectedProduct: productContext || selectedProduct,
                  }),
                });
                
                if (suggestionsResponse.ok) {
                  const suggestionsData = await suggestionsResponse.json();
                  suggestions = suggestionsData.suggestions || [];
                }
              } catch (error) {
                console.error('Error fetching suggestions:', error);
              }
              
              if (suggestions.length > 0) {
                setCurrentSuggestions(suggestions);
              }
              
              // Check if we should show form after 3 assistant responses (only once)
              const updatedMessages = [...newMessages];
              updatedMessages[assistantMessageIndex] = {
                role: 'assistant',
                content: fullContent,
              };
              const assistantResponseCount = updatedMessages.filter(msg => msg.role === 'assistant' && msg.content).length;
              
              if (assistantResponseCount >= 3 && shouldShowForm() && !userData.firstName && !formShownAfterResponses) {
                setFormShownAfterResponses(true);
                setShowUserDataForm(true);
              }
              
              setIsLoading(false);
              focusInputIfNotMobile();
              return;
            }
          } catch (e) {
            console.error('Error parsing stream data:', e);
          }
        }
      }
    }
  };

  // Save user data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('xperience_user_data', JSON.stringify(userData));
    }
  }, [userData]);

  // Check if we need to show the form - show after 3 assistant responses
  const shouldShowForm = () => {
    if (userData.firstName && userData.lastName && userData.email) {
      return false; // Already has data
    }
    // Count assistant responses
    const assistantResponseCount = messages.filter(msg => msg.role === 'assistant' && msg.content).length;
    return assistantResponseCount >= 3;
  };

  const hasConversationStarted = messages.length > 0;

  // Rotating message effect
  useEffect(() => {
    if (!hasConversationStarted) {
      const interval = setInterval(() => {
        setRotatingMessageIndex((prev) => (prev + 1) % ROTATING_MESSAGES.length);
      }, 3000); // Change every 3 seconds
      return () => clearInterval(interval);
    }
  }, [hasConversationStarted]);

  // Scroll behavior - scroll to show start of new assistant messages
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // If it's a new assistant message, scroll to show the start of it
      if (lastMessage.role === 'assistant' && lastMessage.content) {
        // Find the assistant message element
        setTimeout(() => {
          const messageElements = document.querySelectorAll('[data-message-index]');
          if (messageElements.length > 0) {
            const lastElement = messageElements[messageElements.length - 1] as HTMLElement;
            if (lastElement) {
              // Scroll to show the start of the message at the top of viewport
              lastElement.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
            }
          } else {
            // Fallback: scroll to bottom but align to start
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 200);
      } else if (lastMessage.role === 'user') {
        // For user messages, scroll to bottom normally
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
      }
    }
  }, [messages, isLoading]);

  // Auto-focus input when conversation starts or after interactions (desktop only)
  useEffect(() => {
    if (hasConversationStarted && !isLoading) {
      focusInputIfNotMobile();
    }
  }, [hasConversationStarted, isLoading]);

  // Focus input when clicking on page (except buttons/links)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't focus if clicking on buttons, links, or the input itself
      if (
        !target.closest('button') &&
        !target.closest('a') &&
        target !== inputRef.current &&
        !target.closest('input') &&
        !target.closest('form')
      ) {
        setTimeout(() => focusInputIfNotMobile(), 0);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Process pending message after form submission
  const processPendingMessageWithData = async (dataToUse: UserData) => {
    if (!pendingMessage) return;
    
    const userMessage = pendingMessage;
    const productContext = pendingProductContext;
    setPendingMessage(null);
    setPendingProductContext(null);
    setIsLoading(true);

    // Add user message
    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: userMessage },
    ];

    // Add empty assistant message for streaming
    const assistantMessageIndex = newMessages.length;
    setMessages([...newMessages, { 
      role: 'assistant', 
      content: '',
    }]);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages
            .filter((msg) => msg.content || msg.role === 'user')
            .map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
          selectedProduct: productContext || selectedProduct,
          threadId: threadId,
          userData: dataToUse,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      await handleStreamingResponse(response, newMessages, assistantMessageIndex, productContext || selectedProduct);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: "I'm sorry, I encountered an error. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
      focusInputIfNotMobile();
    }
  };

  // Handle form submission
  const handleFormSubmit = async (data: { firstName: string; lastName: string; email: string; phone: string }) => {
    const newUserData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || '',
    };
    setUserData(newUserData);
    setShowUserDataForm(false);
    setFormShownAfterResponses(true); // Mark as shown so it doesn't show again
    
    // Save lead to Supabase
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone || '',
        }),
      });

      if (response.ok) {
        console.log('Lead saved to Supabase successfully');
      } else {
        console.error('Failed to save lead to Supabase:', await response.text());
      }
    } catch (error) {
      console.error('Error saving lead to Supabase:', error);
      // Don't block the user flow if lead saving fails
    }
    
    // Track Lead event when user info is saved
    trackFacebookEvent('Lead', {
      content_name: 'User Information Submitted',
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
    });
    
    // Process the pending message after form submission with updated userData
    if (pendingMessage) {
      // Process with the new userData directly
      setTimeout(() => {
        processPendingMessageWithData(newUserData);
      }, 100);
    }
  };

  // Handle form skip
  const handleFormSkip = () => {
    setShowUserDataForm(false);
    // Process the pending message even if form is skipped (use current userData)
    if (pendingMessage) {
      setTimeout(() => processPendingMessageWithData(userData), 100);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, productContext?: ProductType) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // Check if we need to show the form after 3 assistant responses
    const assistantResponseCount = messages.filter(msg => msg.role === 'assistant' && msg.content).length;
    if (shouldShowForm() && assistantResponseCount >= 3 && !userData.firstName) {
      setPendingMessage(userMessage);
      setShowUserDataForm(true);
      return;
    }

    setIsLoading(true);

    // Add user message
    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: userMessage },
    ];

    // Product cards are shown at bottom, no need to add them to chat messages
    setMessages(newMessages);

    // Add empty assistant message for streaming
    const assistantMessageIndex = newMessages.length;
    setMessages([...newMessages, { 
      role: 'assistant', 
      content: '',
    }]);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages
            .filter((msg) => msg.content || msg.role === 'user')
            .map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
          selectedProduct: productContext || selectedProduct,
          threadId: threadId,
          userData: userData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      await handleStreamingResponse(response, newMessages, assistantMessageIndex, productContext || selectedProduct);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content:
            "I'm sorry, I encountered an error. Please try again in a moment.",
        },
      ]);
      setIsLoading(false);
      focusInputIfNotMobile();
    }
  };

  const handleBuyNow = (productId: ProductType) => {
    // Track AddToCart event for Facebook Pixel
    if (productId) {
      const product = PRODUCTS[productId];
      const planId = getProductPlanId(productId);
      trackFacebookEvent('AddToCart', {
        content_name: product.name,
        content_category: product.subtitle,
        value: parseFloat(PRODUCT_PRICES[productId].replace('$', '')),
        currency: 'USD',
      });
      // Navigate to checkout page
      router.push(`/checkout?planId=${planId}`);
    }
  };

  const handleProductSelect = async (productId: ProductType) => {
    if (isLoading || !productId) return;
    
    setSelectedProduct(productId);

    // Start conversation with product selection
    const userMessage = `Tell me about ${PRODUCTS[productId].name}`;
    
    // Check if we need to show the form after 3 assistant responses
    const assistantResponseCount = messages.filter(msg => msg.role === 'assistant' && msg.content).length;
    if (shouldShowForm() && assistantResponseCount >= 3 && !userData.firstName) {
      setPendingMessage(userMessage);
      setPendingProductContext(productId);
      setShowUserDataForm(true);
      return;
    }
    
    setIsLoading(true);

    const newMessages: Message[] = [
      { role: 'user', content: userMessage },
    ];
    
    // Add empty assistant message for streaming
    const assistantMessageIndex = 1;
    setMessages([...newMessages, { 
      role: 'assistant', 
      content: '',
    }]);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages
            .filter((msg) => msg.content || msg.role === 'user')
            .map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
          selectedProduct: productId,
          threadId: threadId,
          userData: userData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      await handleStreamingResponse(response, newMessages, assistantMessageIndex, productId);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content:
            "I'm sorry, I encountered an error. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
      focusInputIfNotMobile();
    }
  };

  const handleSuggestedPrompt = async (prompt: string) => {
    if (isLoading) return;
    
    const userMessage = prompt;
    setIsLoading(true);

    // Add user message
    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: userMessage },
    ];

    // Add empty assistant message for streaming
    const assistantMessageIndex = newMessages.length;
    setMessages([...newMessages, { 
      role: 'assistant', 
      content: '',
    }]);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages
            .filter((msg) => msg.content || msg.role === 'user')
            .map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
          selectedProduct: selectedProduct,
          threadId: threadId,
          userData: userData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      await handleStreamingResponse(response, newMessages, assistantMessageIndex, selectedProduct);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content:
            "I'm sorry, I encountered an error. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
      focusInputIfNotMobile();
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center px-4 py-6">
      {/* Header with Logo - Hidden in chat view on mobile */}
      {!hasConversationStarted && (
        <div className="w-full max-w-4xl mb-6">
          <div className="flex items-center justify-center py-4">
            <img 
              src="/logo/logo.png" 
              alt="Xperience Living" 
              className="h-12 w-auto"
              onError={(e) => {
                // Fallback if logo doesn't exist yet
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl flex flex-col items-center flex-1 min-h-0">
        {/* Welcome Screen - Only shown when no conversation */}
        {!hasConversationStarted && (
          <div className="flex flex-col items-center justify-center flex-1 text-center mb-8 w-full">
            
            {/* Greeting */}
            <h1 className="text-3xl lg:text-4xl font-semibold text-white mb-3">
              Good to See You! How Can I Assist You?
            </h1>
            
            {/* Subtitle with rotating text */}
            <div className="text-base text-gray-300 mb-12 min-h-[24px]">
              <span className="inline-block animate-fade-in">
                {ROTATING_MESSAGES[rotatingMessageIndex]}
              </span>
              <span className="text-[#0D6B4D] ml-2">Chat with us to learn more.</span>
            </div>

            {/* Product Selection Cards - Mobile First */}
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-6 w-full max-w-3xl mb-8">
              {/* Xperience Youth */}
              <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl md:rounded-2xl p-5 md:p-6 flex flex-col items-center gap-3 md:gap-4 w-full md:w-auto min-w-[280px]">
                <ProductImageGallery
                  productId="youth"
                  className="h-32 w-24 md:h-40 md:w-28 rounded-xl md:rounded-2xl shadow-lg"
                  fallbackGradient="linear-gradient(to bottom, #0D6B4D, #093F2E)"
                  clickable={false}
                />
                <div className="text-center">
                  <h3 className="text-base md:text-lg font-semibold text-white">
                    Xperience Youth
                  </h3>
                  <p className="text-xs md:text-sm text-[#0D6B4D] font-medium mt-1">
                    Liquid Formula
                  </p>
                </div>
                <div className="flex gap-2 w-full mt-2">
                  <button
                    onClick={() => router.push('/product/youth')}
                    className="flex-1 bg-transparent border border-[#0D6B4D] hover:bg-[#0D6B4D]/20 text-[#0D6B4D] font-semibold rounded-full px-2.5 py-1.5 text-xs whitespace-nowrap transition-colors"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleProductSelect('youth')}
                    disabled={isLoading}
                    className="flex-1 bg-[#0D6B4D] hover:bg-[#0b5940] text-white font-semibold rounded-full px-2.5 py-1.5 text-xs whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Learn More
                  </button>
                </div>
              </div>

              {/* Roman Xperience */}
              <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl md:rounded-2xl p-5 md:p-6 flex flex-col items-center gap-3 md:gap-4 w-full md:w-auto min-w-[280px]">
                <ProductImageGallery
                  productId="roman"
                  className="h-32 w-24 md:h-40 md:w-28 rounded-xl md:rounded-2xl shadow-lg"
                  fallbackGradient="linear-gradient(to bottom, #8B4513, #5D2F0A)"
                  clickable={false}
                />
                <div className="text-center">
                  <h3 className="text-base md:text-lg font-semibold text-white">
                    Roman Xperience
                  </h3>
                  <p className="text-xs md:text-sm text-[#8B4513] font-medium mt-1">
                    Premium Formula
                  </p>
                </div>
                <div className="flex gap-2 w-full mt-2">
                  <button
                    onClick={() => router.push('/product/roman')}
                    className="flex-1 bg-transparent border border-[#8B4513] hover:bg-[#8B4513]/20 text-[#8B4513] font-semibold rounded-full px-2.5 py-1.5 text-xs whitespace-nowrap transition-colors"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleProductSelect('roman')}
                    disabled={isLoading}
                    className="flex-1 bg-[#8B4513] hover:bg-[#6B3410] text-white font-semibold rounded-full px-2.5 py-1.5 text-xs whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Learn More
                  </button>
                </div>
              </div>

            </div>

            {/* Customer Support Phone Number - Visible on Welcome Screen */}
            <div className="bg-[#0D6B4D]/20 border border-[#0D6B4D]/40 rounded-xl p-4 mb-6 max-w-md mx-auto">
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-[#0D6B4D]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span className="text-sm text-white font-medium">Need to place an order?</span>
                </div>
                <a
                  href="tel:+12027967881"
                  className="bg-[#0D6B4D] hover:bg-[#0b5940] text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
                >
                  <span>Call (202) 796-7881</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages Area - Only shown when conversation started */}
        {hasConversationStarted && (
          <div className="w-full max-w-3xl flex-1 flex flex-col mb-4 min-h-0">
            {/* Chat Messages - Full width, natural flow */}
            <div className="flex flex-col gap-3 md:gap-4 flex-1 overflow-y-auto min-h-0 pb-4" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                {/* Customer Support Phone Number - Prominent at Top of Messages */}
                <div className="bg-[#0D6B4D]/20 border border-[#0D6B4D]/40 rounded-xl p-3 mb-2">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-[#0D6B4D]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      <span className="text-sm text-white font-medium">Need to place an order?</span>
                    </div>
                    <a
                      href="tel:+12027967881"
                      className="bg-[#0D6B4D] hover:bg-[#0b5940] text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
                    >
                      <span>Call (202) 796-7881</span>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
                {messages.map((message, index) => (
                  <div key={index} data-message-index={index}>
                    {/* Only show messages with content - product cards are shown at bottom */}
                    {message.content && (
                      <div
                        className={`flex flex-col ${
                          message.role === 'user' ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div className={`flex ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}>
                          {message.role === 'assistant' && (
                            <div className="w-8 h-8 bg-[#0D6B4D] text-white text-xs flex items-center justify-center rounded-full mr-3 flex-shrink-0">
                              😊
                            </div>
                          )}
                          <div
                            className={`rounded-2xl px-5 py-3 max-w-[85%] ${
                              message.role === 'assistant'
                                ? 'bg-[#2a2a2a] text-white border border-[#3a3a3a]'
                                : 'bg-[#0D6B4D] text-white'
                            }`}
                          >
                            <div 
                              className="text-sm md:text-base leading-relaxed whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{
                                __html: message.content
                                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                  .replace(/\n/g, '<br />')
                              }}
                            />
                          </div>
                        </div>
                        
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="w-8 h-8 bg-[#0D6B4D] text-white text-xs flex items-center justify-center rounded-full mr-3 flex-shrink-0">
                      😊
                    </div>
                    <div className="bg-[#2a2a2a] rounded-2xl px-5 py-3 border border-[#3a3a3a]">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce opacity-70"></div>
                        <div
                          className="w-2 h-2 bg-white rounded-full animate-bounce opacity-70"
                          style={{ animationDelay: '0.2s' }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-white rounded-full animate-bounce opacity-70"
                          style={{ animationDelay: '0.4s' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
          </div>
        )}

        {/* Persistent Product Cards - Collapsible on mobile and desktop when conversation started */}
        {hasConversationStarted && (
          <div className="w-full max-w-3xl mb-4">
            {/* Collapsible header for product cards - visible on all screen sizes */}
            <div className="mb-2">
              <button
                onClick={() => setShowProductCards(!showProductCards)}
                className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-4 py-2 flex items-center justify-between text-white text-sm"
              >
                <span>Products</span>
                <svg
                  className={`w-5 h-5 transition-transform ${showProductCards ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {/* Product Cards - Hidden when collapsed, visible when expanded */}
            <div className={`${showProductCards ? 'flex' : 'hidden'} flex-col md:flex-row justify-center items-center gap-3 md:gap-4 mb-4`}>
              {/* Xperience Youth Card */}
              <div className="bg-[#2a2a2a] rounded-xl md:rounded-2xl border border-[#3a3a3a] p-3 md:p-4 flex gap-3 md:gap-4 items-center">
                {/* Show image on both mobile and desktop, smaller on mobile */}
                <ProductImageGallery
                  productId="youth"
                  className="h-16 w-12 md:h-28 md:w-20 rounded-lg md:rounded-xl flex-shrink-0 shadow-lg"
                  fallbackGradient="linear-gradient(to bottom, #0D6B4D, #093F2E)"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm md:text-base font-semibold text-white truncate">
                    {PRODUCTS.youth.name}
                  </h3>
                  <p className="text-xs text-[#0D6B4D] font-medium mt-0.5">
                    {PRODUCTS.youth.subtitle}
                  </p>
                  <p className="text-xs md:text-sm font-bold text-white mt-1.5">
                    {PRODUCT_PRICES.youth}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => router.push('/product/youth')}
                      className="flex-1 bg-transparent border border-[#0D6B4D] hover:bg-[#0D6B4D]/20 text-[#0D6B4D] font-semibold rounded-full px-3 md:px-4 py-1 md:py-1.5 text-xs transition-colors"
                    >
                      VIEW DETAILS
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProduct('youth');
                        handleBuyNow('youth');
                      }}
                      className="flex-1 bg-[#0D6B4D] hover:bg-[#0b5940] text-white font-semibold rounded-full px-3 md:px-4 py-1 md:py-1.5 text-xs transition-colors"
                    >
                      BUY NOW
                    </button>
                  </div>
                </div>
              </div>

              {/* Roman Xperience Card */}
              <div className="bg-[#2a2a2a] rounded-xl md:rounded-2xl border border-[#3a3a3a] p-3 md:p-4 flex gap-3 md:gap-4 items-center">
                {/* Show image on both mobile and desktop, smaller on mobile */}
                <ProductImageGallery
                  productId="roman"
                  className="h-16 w-12 md:h-28 md:w-20 rounded-lg md:rounded-xl flex-shrink-0 shadow-lg"
                  fallbackGradient="linear-gradient(to bottom, #8B4513, #5D2F0A)"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm md:text-base font-semibold text-white truncate">
                    {PRODUCTS.roman.name}
                  </h3>
                  <p className="text-xs text-[#8B4513] font-medium mt-0.5">
                    {PRODUCTS.roman.subtitle}
                  </p>
                  <p className="text-xs md:text-sm font-bold text-white mt-1.5">
                    {PRODUCT_PRICES.roman}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => router.push('/product/roman')}
                      className="flex-1 bg-transparent border border-[#8B4513] hover:bg-[#8B4513]/20 text-[#8B4513] font-semibold rounded-full px-3 md:px-4 py-1 md:py-1.5 text-xs transition-colors"
                    >
                      VIEW DETAILS
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProduct('roman');
                        handleBuyNow('roman');
                      }}
                      className="flex-1 bg-[#8B4513] hover:bg-[#6B3410] text-white font-semibold rounded-full px-3 md:px-4 py-1 md:py-1.5 text-xs transition-colors"
                    >
                      BUY NOW
                    </button>
                  </div>
                </div>
              </div>

                  </div>
            
            {/* Question Suggestions - Below product cards, smaller on mobile */}
            {currentSuggestions.length > 0 && !isLoading && (
              <div className="bg-[#0D6B4D]/20 border border-[#0D6B4D]/40 rounded-xl md:rounded-2xl p-2 md:p-4 mb-3 md:mb-4">
                <h3 className="text-xs md:text-sm font-semibold text-[#0D6B4D] mb-2 md:mb-3">
                  Question Suggestions
                </h3>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  {currentSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={async () => {
                        if (isLoading) return;
                        setIsLoading(true);
                        
                        // Add user message
                        const userMessage = suggestion;
                        const updatedMessages: Message[] = [
                          ...messages,
                          { role: 'user', content: userMessage },
                        ];
                        
                        // Add empty assistant message for streaming
                        const assistantMessageIndex = updatedMessages.length;
                        setMessages([...updatedMessages, { 
                          role: 'assistant', 
                          content: '',
                        }]);
                        
                        try {
                          const response = await fetch('/api/chat/stream', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              messages: updatedMessages
                                .filter((msg) => msg.content || msg.role === 'user')
                                .map((msg) => ({
                                  role: msg.role,
                                  content: msg.content,
                                })),
                              selectedProduct: selectedProduct,
                              threadId: threadId,
                              userData: userData,
                            }),
                          });

                          if (!response.ok) {
                            throw new Error('Failed to get AI response');
                          }

                          await handleStreamingResponse(response, updatedMessages, assistantMessageIndex, selectedProduct);
                        } catch (error) {
                          console.error('Error sending message:', error);
                          setMessages([
                            ...updatedMessages,
                            {
                              role: 'assistant',
                              content: "I'm sorry, I encountered an error. Please try again in a moment.",
                            },
                          ]);
                          setIsLoading(false);
                          focusInputIfNotMobile();
                        }
                      }}
                      disabled={isLoading}
                      className="px-2.5 md:px-4 py-1.5 md:py-2 bg-[#0D6B4D] hover:bg-[#0b5940] border border-[#0D6B4D] rounded-full text-[10px] md:text-xs text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed leading-tight"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chat Input */}
        <div className="w-full max-w-3xl mt-4">
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-full px-4 py-3 shadow-lg"
          >
            <button
              type="button"
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Add attachment"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-gray-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="text-[#0D6B4D] hover:text-[#0b5940] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Send message"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </form>

          {/* Suggested Prompts - Only shown when no conversation */}
          {!hasConversationStarted && (
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {SUGGESTED_PROMPTS.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedPrompt(prompt.text)}
                  className="px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-full text-sm text-white hover:bg-[#3a3a3a] transition-colors flex items-center gap-2"
                >
                  <span>{prompt.icon}</span>
                  <span>{prompt.text}</span>
                </button>
              ))}
            </div>
          )}

          <p className="text-[11px] text-gray-500 mt-3 text-center">
            These statements have not been evaluated by the FDA. This product is
            not intended to diagnose, treat, cure, or prevent any disease.
          </p>
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* User Data Form */}
      <UserDataForm
        isOpen={showUserDataForm}
        onSubmit={handleFormSubmit}
        onSkip={handleFormSkip}
      />
    </div>
  );
}

