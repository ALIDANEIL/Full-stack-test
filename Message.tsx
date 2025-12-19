import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { MessageRole } from '../types';

interface MessageProps {
  role: MessageRole;
  content: string;
}

/**
 * Renders a single chat message, styling it based on the sender's role
 * and rendering markdown content.
 */
const Message: React.FC<MessageProps> = ({ role, content }) => {
  const isUser = role === MessageRole.User;
  const messageClasses = isUser
    ? 'bg-blue-500 text-white self-end rounded-br-none'
    : 'bg-gray-200 text-gray-800 self-start rounded-bl-none';

  return (
    <div
      className={`max-w-[70%] md:max-w-[50%] p-3 my-2 rounded-lg shadow-md ${messageClasses} break-words`}
    >
      <ReactMarkdown
        children={content}
        components={{
          // Fix: Properly handle inline vs block code and pass props.
          // Fix: Type assertion for dracula style to resolve TypeScript error.
          code({ node, inline, className, children, ...rest }) {
            const match = /language-(\w+)/.exec(className || '');
            if (inline) {
              return (
                <code className={`${className} bg-gray-300 text-red-700 px-1 py-0.5 rounded-sm`} {...rest}>
                  {children}
                </code>
              );
            } else if (match) {
              return (
                <SyntaxHighlighter
                  children={String(children).replace(/\n$/, '')}
                  style={dracula as any} // Cast to any to bypass type incompatibility
                  language={match[1]}
                  PreTag="div"
                  {...rest}
                />
              );
            } else {
              // Fallback for block code without a specified language
              return (
                <code className={`${className} bg-gray-300 text-red-700 px-1 py-0.5 rounded-sm`} {...rest}>
                  {children}
                </code>
              );
            }
          },
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {props.children}
            </a>
          ),
          p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2" {...props} />,
          li: ({ node, ...props }) => <li className="mb-1" {...props} />,
        }}
      />
    </div>
  );
};

export default Message;