'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UserDataForm from './UserDataForm';
import { trackFacebookEvent } from './FacebookPixel';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type ProductType = 'youth' | 'roman' | null;

interface UserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

interface FloatingChatWidgetProps {
  selectedProduct?: ProductType;
}

export default function FloatingChatWidget({ selectedProduct = null }: FloatingChatWidgetProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false); // Closed by default on product pages
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
  const [showUserDataForm, setShowUserDataForm] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [formShownAfterResponses, setFormShownAfterResponses] = useState(false);
  const [userData, setUserData] = useState<UserData>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('xperience_user_data');
      const data = stored ? JSON.parse(stored) : {};
      const hasRequiredData = data.firstName && data.lastName && data.email;
      return hasRequiredData ? data : {};
    }
    return {};
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInputIfNotMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth > 768) {
      inputRef.current?.focus();
    }
  };

  const handleStreamingResponse = async (
    response: Response,
    newMessages: Message[],
    assistantMessageIndex: number,
    productContext?: ProductType
  ) => {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let currentThreadId = threadId;

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('xperience_user_data', JSON.stringify(userData));
    }
  }, [userData]);

  const shouldShowForm = () => {
    if (userData.firstName && userData.lastName && userData.email) {
      return false;
    }
    const assistantResponseCount = messages.filter(msg => msg.role === 'assistant' && msg.content).length;
    return assistantResponseCount >= 3;
  };

  useEffect(() => {
    if (messages.length > 0 && isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [messages, isLoading, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    const assistantResponseCount = messages.filter(msg => msg.role === 'assistant' && msg.content).length;
    if (shouldShowForm() && assistantResponseCount >= 3 && !userData.firstName) {
      setPendingMessage(userMessage);
      setShowUserDataForm(true);
      return;
    }

    setIsLoading(true);

    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: userMessage },
    ];

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
          content: "I'm sorry, I encountered an error. Please try again in a moment.",
        },
      ]);
      setIsLoading(false);
      focusInputIfNotMobile();
    }
  };

  const handleFormSubmit = async (data: { firstName: string; lastName: string; email: string; phone: string }) => {
    const newUserData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || '',
    };
    setUserData(newUserData);
    setShowUserDataForm(false);
    setFormShownAfterResponses(true);
    
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
      }
    } catch (error) {
      console.error('Error saving lead to Supabase:', error);
    }
    
    trackFacebookEvent('Lead', {
      content_name: 'User Information Submitted',
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
    });
    
    if (pendingMessage) {
      setTimeout(() => {
        const userMessage = pendingMessage;
        setPendingMessage(null);
        setIsLoading(true);

        const newMessages: Message[] = [
          ...messages,
          { role: 'user', content: userMessage },
        ];

        const assistantMessageIndex = newMessages.length;
        setMessages([...newMessages, { 
          role: 'assistant', 
          content: '',
        }]);

        fetch('/api/chat/stream', {
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
            userData: newUserData,
          }),
        })
        .then(response => {
          if (!response.ok) throw new Error('Failed to get AI response');
          return handleStreamingResponse(response, newMessages, assistantMessageIndex, selectedProduct);
        })
        .catch(error => {
          console.error('Error sending message:', error);
          setMessages([
            ...newMessages,
            {
              role: 'assistant',
              content: "I'm sorry, I encountered an error. Please try again in a moment.",
            },
          ]);
          setIsLoading(false);
        });
      }, 100);
    }
  };

  const handleFormSkip = () => {
    setShowUserDataForm(false);
    if (pendingMessage) {
      setTimeout(() => {
        const userMessage = pendingMessage;
        setPendingMessage(null);
        handleSendMessage();
      }, 100);
    }
  };

  return (
    <>
      {/* Prominent Floating Chat Button */}
      {!isOpen && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-3 animate-bounce-subtle">
          {/* Nudge Message */}
          <div className="bg-[#0D6B4D] text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium whitespace-nowrap animate-pulse">
            💬 Have a question? Ask us!
          </div>
          
          {/* Chat Button */}
          <button
            onClick={() => setIsOpen(true)}
            className="bg-[#0D6B4D] hover:bg-[#0b5940] text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 transition-all hover:scale-110 active:scale-95 text-lg font-semibold border-2 border-white/20"
            aria-label="Open chat"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>Chat with us</span>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"></div>
          </button>
        </div>
      )}

      {/* Chat Window - Always Open, Floating at Bottom Center */}
      {isOpen && (
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-4xl md:bottom-6 md:h-[400px] z-50 flex flex-col bg-[#1a1a1a] border-t md:border md:border-[#3a3a3a] rounded-t-3xl md:rounded-3xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#3a3a3a] bg-[#2a2a2a] rounded-t-3xl md:rounded-t-3xl">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className="text-white font-semibold">Chat with us</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Minimize chat"
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
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0" style={{ maxHeight: '300px' }}>
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-sm py-8">
                <div className="mb-2">
                  <svg
                    className="w-12 h-12 mx-auto text-[#0D6B4D] opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <p className="text-white font-medium">How can I help you today?</p>
                <p className="text-gray-500 text-xs mt-1">Ask me anything about our products</p>
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-[#0D6B4D] text-white text-xs flex items-center justify-center rounded-full mr-3 flex-shrink-0">
                    😊
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-2 max-w-[80%] ${
                    message.role === 'assistant'
                      ? 'bg-[#2a2a2a] text-white border border-[#3a3a3a]'
                      : 'bg-[#0D6B4D] text-white'
                  }`}
                >
                  <div 
                    className="text-sm leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: message.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br />')
                    }}
                  />
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="w-8 h-8 bg-[#0D6B4D] text-white text-xs flex items-center justify-center rounded-full mr-3 flex-shrink-0">
                  😊
                </div>
                <div className="bg-[#2a2a2a] rounded-2xl px-4 py-2 border border-[#3a3a3a]">
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
            {currentSuggestions.length > 0 && !isLoading && (
              <div className="bg-[#0D6B4D]/20 border border-[#0D6B4D]/40 rounded-xl p-3">
                <h4 className="text-xs font-semibold text-[#0D6B4D] mb-2">Question Suggestions</h4>
                <div className="flex flex-wrap gap-2">
                  {currentSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(suggestion);
                        setTimeout(() => handleSendMessage(), 100);
                      }}
                      className="px-3 py-1.5 bg-[#0D6B4D] hover:bg-[#0b5940] border border-[#0D6B4D] rounded-full text-xs text-white font-medium transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-[#3a3a3a]">
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-full px-4 py-2"
            >
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
          </div>
        </div>
      )}

      {/* User Data Form */}
      <UserDataForm
        isOpen={showUserDataForm}
        onSubmit={handleFormSubmit}
        onSkip={handleFormSkip}
      />
    </>
  );
}

