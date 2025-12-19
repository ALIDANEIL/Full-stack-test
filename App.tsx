import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatWindow from './components/ChatWindow';
import { ChatMessage, MessageRole } from './types';
import { createChatSession, sendMessage } from './services/geminiService';
import { Chat } from '@google/genai'; // Import Chat type

/**
 * The main application component for the Freelance Full-Stack AI Assistant.
 * Manages chat state, user input, and interaction with the Gemini API.
 */
const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const isInitialLoad = useRef(true);

  /**
   * Initializes the chat session when the component mounts.
   * Uses `useEffect` with an empty dependency array to run only once.
   */
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      const initializeChat = async () => {
        setIsLoading(true);
        try {
          chatSessionRef.current = await createChatSession();
          setMessages([
            {
              role: MessageRole.AI,
              content: `Hello there! I'm your Freelance Full-Stack AI Assistant. 🧑‍💻 How can I help you on your journey to becoming a successful freelance developer today? 🤔`,
            },
          ]);
        } catch (error) {
          console.error("Failed to initialize chat session:", error);
          setMessages([
            {
              role: MessageRole.AI,
              content: `Oh no! 😟 I couldn't start our chat. Please ensure your API key is correctly configured. (ai.google.dev/gemini-api/docs/billing)`,
            },
          ]);
        } finally {
          setIsLoading(false);
        }
      };
      initializeChat();
    }
  }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

  /**
   * Handles sending a message to the AI.
   * Uses `useCallback` to prevent unnecessary re-renders and memoize the function.
   */
  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: MessageRole.User, content: input.trim() };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    setIsLoading(true);

    let fullAIResponse = '';
    const onChunkReceived = (chunk: string) => {
      fullAIResponse += chunk;
      setMessages((prevMessages) => {
        const lastMessage = prevMessages[prevMessages.length - 1];
        if (lastMessage && lastMessage.role === MessageRole.AI) {
          // Update the last AI message with the new chunk
          return [
            ...prevMessages.slice(0, prevMessages.length - 1),
            { ...lastMessage, content: fullAIResponse },
          ];
        } else {
          // If the last message wasn't AI, create a new one
          return [...prevMessages, { role: MessageRole.AI, content: fullAIResponse }];
        }
      });
    };

    try {
      await sendMessage(userMessage.content, onChunkReceived);
    } catch (error) {
      console.error('Error during message streaming:', error);
      // The error message is already handled in geminiService.ts and passed via onChunkReceived
      // If the AI message isn't there, add a generic error message
      setMessages((prevMessages) => {
        const lastMessage = prevMessages[prevMessages.length - 1];
        if (!lastMessage || lastMessage.role !== MessageRole.AI || !lastMessage.content.startsWith("Error:")) {
            return [...prevMessages, { role: MessageRole.AI, content: `Error: Could not get a response. Please try again or check console for details. 😞` }];
        }
        return prevMessages;
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent new line in input
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleClearChat = useCallback(async () => {
    setIsLoading(true);
    setMessages([]); // Clear messages immediately
    try {
      chatSessionRef.current = await createChatSession(); // Recreate session
      setMessages([
        {
          role: MessageRole.AI,
          content: `Chat cleared! 👋 I'm ready for new questions about your freelance full-stack journey. What's on your mind? 🤔`,
        },
      ]);
    } catch (error) {
      console.error("Failed to reinitialize chat session after clearing:", error);
      setMessages([
        {
          role: MessageRole.AI,
          content: `Oh no! 😟 I couldn't reset our chat. Please ensure your API key is correctly configured. (ai.google.dev/gemini-api/docs/billing)`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50 antialiased">
      {/* Header */}
      <header className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 shadow-lg z-10">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center">
            <span className="mr-2 text-3xl">🚀</span> Freelance Full-Stack AI Assistant
          </h1>
          <button
            onClick={handleClearChat}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-lg shadow-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            title="Start a new conversation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.928c.95 0 1.583 1.053 1.154 1.889l-2.073 3.918c-.375.712-1.246 1.145-2.073 1.145H9.408c-1.554 0-2.91-1.127-3.238-2.651L4.85 9.431c-.328-1.524 1.028-2.651 2.582-2.651H21m-1.566 7.642L21 21M6.75 1.5v2.25M6.75 7.5v2.25m10.5-6L21 6" />
            </svg>
            New Chat
          </button>
        </div>
      </header>

      {/* Chat Window */}
      <ChatWindow messages={messages} isLoading={isLoading} />

      {/* Input Area */}
      <div className="sticky bottom-0 bg-white p-4 border-t border-gray-200 shadow-lg z-10 flex-shrink-0">
        <div className="container mx-auto flex items-center space-x-3">
          <input
            type="text"
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-gray-800 placeholder-gray-400"
            placeholder={isLoading ? 'AI is typing...' : 'Ask your questions here...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            title="Send Message"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            )}
            <span className="hidden sm:inline ml-2">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;