'use client';

import { useState, useRef, useEffect } from 'react';
import CheckoutModal from './CheckoutModal';
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

const PRODUCTS: Record<'youth' | 'roman', Omit<Product, 'planId'>> = {
  youth: {
    id: 'youth',
    name: 'Xperience Youth',
    subtitle: 'Volumex Liquid',
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductType>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
  const [showUserDataForm, setShowUserDataForm] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [pendingProductContext, setPendingProductContext] = useState<ProductType>(null);
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

  // Save user data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('xperience_user_data', JSON.stringify(userData));
    }
  }, [userData]);

  // Check if we need to show the form when first message is about to be sent
  const shouldShowForm = () => {
    return !userData.firstName || !userData.lastName || !userData.email;
  };

  const hasConversationStarted = messages.length > 0;
  const currentProduct = selectedProduct ? {
    ...PRODUCTS[selectedProduct],
    planId: getProductPlanId(selectedProduct),
  } : null;

  // Scroll to bottom when messages change - with delay to ensure content is rendered
  useEffect(() => {
    if (messages.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [messages, isLoading]);

  // Auto-focus input when conversation starts or after interactions
  useEffect(() => {
    if (hasConversationStarted && !isLoading) {
      inputRef.current?.focus();
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
        setTimeout(() => inputRef.current?.focus(), 0);
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

    setMessages(newMessages);

    try {
      const response = await fetch('/api/chat', {
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

      const data = await response.json();
      
      // Generate suggested questions based on AI response
      let suggestions: string[] = [];
      try {
        const suggestionsResponse = await fetch('/api/chat/suggestions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            aiResponse: data.message,
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
      
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: data.message,
      }]);
      
      if (suggestions.length > 0) {
        setCurrentSuggestions(suggestions);
      }
      
      if (data.threadId) {
        setThreadId(data.threadId);
      }
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
      inputRef.current?.focus();
    }
  };

  // Handle form submission
  const handleFormSubmit = (data: { firstName: string; lastName: string; email: string; phone: string }) => {
    const newUserData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || '',
    };
    setUserData(newUserData);
    setShowUserDataForm(false);
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

    // Check if we need to show the form first
    if (shouldShowForm() && messages.length === 0) {
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

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages
            .filter((msg) => msg.content || msg.role === 'user') // Only send messages with content or user messages
            .map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
          selectedProduct: productContext || selectedProduct,
          threadId: threadId, // Send thread ID to maintain conversation context
          userData: userData, // Send user data for personalization
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      // Generate suggested questions based on AI response
      let suggestions: string[] = [];
      try {
        const suggestionsResponse = await fetch('/api/chat/suggestions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            aiResponse: data.message,
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
      
      // Simply append AI response - product cards are shown at bottom
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: data.message,
      }]);
      
      // Update current suggestions to show below product cards
      if (suggestions.length > 0) {
        setCurrentSuggestions(suggestions);
      }
      
      // Save thread ID for future messages
      if (data.threadId) {
        setThreadId(data.threadId);
      }
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
      inputRef.current?.focus();
    }
  };

  const handleBuyNow = (productId: ProductType) => {
    // Track AddToCart event for Facebook Pixel
    if (productId) {
      const product = PRODUCTS[productId];
      trackFacebookEvent('AddToCart', {
        content_name: product.name,
        content_category: product.subtitle,
        value: parseFloat(PRODUCT_PRICES[productId].replace('$', '')),
        currency: 'USD',
      });
    }
    setIsModalOpen(true);
  };

  const handleProductSelect = async (productId: ProductType) => {
    if (isLoading || !productId) return;
    
    setSelectedProduct(productId);

    // Start conversation with product selection
    const userMessage = `Tell me about ${PRODUCTS[productId].name}`;
    
    // Check if we need to show the form first
    if (shouldShowForm() && messages.length === 0) {
      setPendingMessage(userMessage);
      setPendingProductContext(productId);
      setShowUserDataForm(true);
      return;
    }
    
    setIsLoading(true);

    const newMessages: Message[] = [
      { role: 'user', content: userMessage },
    ];
    setMessages(newMessages);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages
            .filter((msg) => msg.content || msg.role === 'user') // Only send messages with content or user messages
            .map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
          selectedProduct: productId,
          threadId: threadId, // Send thread ID to maintain conversation context
          userData: userData, // Send user data for personalization
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      // Generate suggested questions based on AI response
      let suggestions: string[] = [];
      try {
        const suggestionsResponse = await fetch('/api/chat/suggestions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            aiResponse: data.message,
            selectedProduct: productId,
          }),
        });
        
        if (suggestionsResponse.ok) {
          const suggestionsData = await suggestionsResponse.json();
          suggestions = suggestionsData.suggestions || [];
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
      
      // Simply append AI response - product cards are shown at bottom
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: data.message,
      }]);
      
      // Update current suggestions to show below product cards
      if (suggestions.length > 0) {
        setCurrentSuggestions(suggestions);
      }
      
      // Save thread ID for future messages
      if (data.threadId) {
        setThreadId(data.threadId);
      }
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
      inputRef.current?.focus();
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

    // Product cards are shown at bottom, no need to add them to chat messages
    setMessages(newMessages);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages
            .filter((msg) => msg.content || msg.role === 'user') // Only send messages with content or user messages
            .map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
          selectedProduct: selectedProduct,
          threadId: threadId, // Send thread ID to maintain conversation context
          userData: userData, // Send user data for personalization
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      // Generate suggested questions based on AI response
      let suggestions: string[] = [];
      try {
        const suggestionsResponse = await fetch('/api/chat/suggestions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            aiResponse: data.message,
            selectedProduct: selectedProduct,
          }),
        });
        
        if (suggestionsResponse.ok) {
          const suggestionsData = await suggestionsResponse.json();
          suggestions = suggestionsData.suggestions || [];
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
      
      // Simply append AI response - product cards are shown at bottom
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: data.message,
      }]);
      
      // Update current suggestions to show below product cards
      if (suggestions.length > 0) {
        setCurrentSuggestions(suggestions);
      }
      
      // Save thread ID for future messages
      if (data.threadId) {
        setThreadId(data.threadId);
      }
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
      inputRef.current?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center px-4 py-6">
      {/* Header with Logo */}
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

      <div className="w-full max-w-4xl flex flex-col items-center flex-1 min-h-0">
        {/* Welcome Screen - Only shown when no conversation */}
        {!hasConversationStarted && (
          <div className="flex flex-col items-center justify-center flex-1 text-center mb-8 w-full">
            
            {/* Greeting */}
            <h1 className="text-3xl lg:text-4xl font-semibold text-white mb-3">
              Good to See You! How Can I be an Assistance?
            </h1>
            
            {/* Subtitle */}
            <p className="text-base text-gray-300 mb-12">
              I'm available 24/7 for you, ask me anything.
            </p>

            {/* Product Selection Cards - Mobile First */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full max-w-2xl mb-8">
              {/* Xperience Youth */}
              <button
                onClick={() => handleProductSelect('youth')}
                disabled={isLoading}
                className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl md:rounded-2xl p-4 md:p-6 hover:bg-[#3a3a3a] transition-colors flex flex-col items-center gap-3 md:gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ProductImageGallery
                  productId="youth"
                  className="h-32 w-24 md:h-40 md:w-28 rounded-xl md:rounded-2xl shadow-lg"
                  fallbackGradient="linear-gradient(to bottom, #0D6B4D, #093F2E)"
                />
                <div className="text-center">
                  <h3 className="text-base md:text-lg font-semibold text-white">
                    Xperience Youth
                  </h3>
                  <p className="text-xs md:text-sm text-[#0D6B4D] font-medium mt-1">
                    Volumex Liquid
                  </p>
                  <p className="text-sm md:text-base font-bold text-white mt-2">
                    {PRODUCT_PRICES.youth}
                  </p>
                </div>
              </button>

              {/* Roman Xperience */}
              <button
                onClick={() => handleProductSelect('roman')}
                disabled={isLoading}
                className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl md:rounded-2xl p-4 md:p-6 hover:bg-[#3a3a3a] transition-colors flex flex-col items-center gap-3 md:gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ProductImageGallery
                  productId="roman"
                  className="h-32 w-24 md:h-40 md:w-28 rounded-xl md:rounded-2xl shadow-lg"
                  fallbackGradient="linear-gradient(to bottom, #8B4513, #5D2F0A)"
                />
                <div className="text-center">
                  <h3 className="text-base md:text-lg font-semibold text-white">
                    Roman Xperience
                  </h3>
                  <p className="text-xs md:text-sm text-[#8B4513] font-medium mt-1">
                    Premium Formula
                  </p>
                  <p className="text-sm md:text-base font-bold text-white mt-2">
                    {PRODUCT_PRICES.roman}
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Chat Messages Area - Only shown when conversation started */}
        {hasConversationStarted && (
          <div className="w-full max-w-3xl flex-1 flex flex-col mb-4 min-h-0">
            {/* Chat Messages - Full width, natural flow */}
            <div className="flex flex-col gap-3 md:gap-4 flex-1 overflow-y-auto min-h-0 pb-4" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                {messages.map((message, index) => (
                  <div key={index}>
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
                              AI
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
                      AI
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

        {/* Persistent Product Cards - Always visible when conversation started */}
        {hasConversationStarted && (
          <div className="w-full max-w-3xl mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4">
              {/* Xperience Youth Card */}
              <div className="bg-[#2a2a2a] rounded-xl md:rounded-2xl border border-[#3a3a3a] p-3 md:p-4 flex gap-3 md:gap-4 items-center">
                <ProductImageGallery
                  productId="youth"
                  className="h-20 w-16 md:h-28 md:w-20 rounded-lg md:rounded-xl flex-shrink-0 shadow-lg"
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
                  <button
                    onClick={() => {
                      setSelectedProduct('youth');
                      handleBuyNow('youth');
                    }}
                    className="mt-2 w-full bg-[#0D6B4D] hover:bg-[#0b5940] text-white font-semibold rounded-full px-3 md:px-4 py-1 md:py-1.5 text-xs transition-colors"
                  >
                    BUY NOW
                  </button>
                </div>
              </div>

              {/* Roman Xperience Card */}
              <div className="bg-[#2a2a2a] rounded-xl md:rounded-2xl border border-[#3a3a3a] p-3 md:p-4 flex gap-3 md:gap-4 items-center">
                <ProductImageGallery
                  productId="roman"
                  className="h-20 w-16 md:h-28 md:w-20 rounded-lg md:rounded-xl flex-shrink-0 shadow-lg"
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
                  <button
                    onClick={() => {
                      setSelectedProduct('roman');
                      handleBuyNow('roman');
                    }}
                    className="mt-2 w-full bg-[#8B4513] hover:bg-[#6B3410] text-white font-semibold rounded-full px-3 md:px-4 py-1 md:py-1.5 text-xs transition-colors"
                  >
                    BUY NOW
                  </button>
                </div>
              </div>
            </div>
            
            {/* Question Suggestions - Below product cards */}
            {currentSuggestions.length > 0 && !isLoading && (
              <div className="bg-[#0D6B4D]/20 border border-[#0D6B4D]/40 rounded-2xl p-4 mb-4">
                <h3 className="text-sm font-semibold text-[#0D6B4D] mb-3">
                  Question Suggestions
                </h3>
                <div className="flex flex-wrap gap-2">
                  {currentSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (isLoading) return;
                        setInput(suggestion);
                        setIsLoading(true);
                        
                        // Add user message
                        const userMessage = suggestion;
                        const updatedMessages: Message[] = [
                          ...messages,
                          { role: 'user', content: userMessage },
                        ];
                        setMessages(updatedMessages);
                        setInput('');
                        
                        // Send message immediately
                        fetch('/api/chat', {
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
                            userData: userData, // Send user data for personalization
                          }),
                        })
                          .then(async (response) => {
                            if (!response.ok) {
                              throw new Error('Failed to get AI response');
                            }
                            const data = await response.json();
                            
                            // Generate suggested questions based on AI response
                            let newSuggestions: string[] = [];
                            try {
                              const suggestionsResponse = await fetch('/api/chat/suggestions', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  aiResponse: data.message,
                                  selectedProduct: selectedProduct,
                                }),
                              });
                              
                              if (suggestionsResponse.ok) {
                                const suggestionsData = await suggestionsResponse.json();
                                newSuggestions = suggestionsData.suggestions || [];
                              }
                            } catch (error) {
                              console.error('Error fetching suggestions:', error);
                            }
                            
                            setMessages([...updatedMessages, { 
                              role: 'assistant', 
                              content: data.message,
                            }]);
                            
                            // Update current suggestions
                            if (newSuggestions.length > 0) {
                              setCurrentSuggestions(newSuggestions);
                            } else {
                              setCurrentSuggestions([]);
                            }
                            
                            if (data.threadId) {
                              setThreadId(data.threadId);
                            }
                          })
                          .catch((error) => {
                            console.error('Error sending message:', error);
                            setMessages([
                              ...updatedMessages,
                              {
                                role: 'assistant',
                                content:
                                  "I'm sorry, I encountered an error. Please try again in a moment.",
                              },
                            ]);
                          })
                          .finally(() => {
                            setIsLoading(false);
                            setTimeout(() => inputRef.current?.focus(), 0);
                          });
                      }}
                      disabled={isLoading}
                      className="px-4 py-2 bg-[#0D6B4D] hover:bg-[#0b5940] border border-[#0D6B4D] rounded-full text-xs text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              autoFocus
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

      {/* Checkout Modal */}
      {currentProduct && (
        <CheckoutModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          planId={currentProduct.planId}
        />
      )}
    </div>
  );
}

