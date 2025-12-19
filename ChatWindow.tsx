import React, { useEffect, useRef } from 'react';
import Message from './Message';
import { ChatMessage, MessageRole } from '../types';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

/**
 * Displays the chat history and handles auto-scrolling.
 * Also shows a typing indicator when the AI is loading.
 */
const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]); // Scroll whenever messages or loading state changes

  return (
    <div className="flex-1 p-4 overflow-y-auto space-y-4">
      {messages.length === 0 && !isLoading && (
        <div className="flex items-center justify-center h-full text-gray-500 text-lg italic">
          👋 Ask me anything about becoming a freelance full-stack developer!
        </div>
      )}
      {messages.map((message, index) => (
        <Message key={index} role={message.role} content={message.content} />
      ))}
      {isLoading && (
        // Fix: Use MessageRole.AI for the loading indicator's role for type consistency.
        <div className="flex items-center self-start bg-gray-200 text-gray-800 p-3 my-2 rounded-lg shadow-md rounded-bl-none max-w-[50%]">
          <div className="animate-bounce delay-0 mr-1 text-2xl">.</div>
          <div className="animate-bounce delay-75 mr-1 text-2xl">.</div>
          <div className="animate-bounce delay-150 text-2xl">.</div>
          <span className="ml-2 italic">AI is thinking...</span>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatWindow;