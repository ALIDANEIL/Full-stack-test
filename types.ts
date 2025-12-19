/**
 * Represents a single message in the chat.
 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
}

/**
 * Represents the role of the message sender.
 */
export enum MessageRole {
  User = 'user',
  AI = 'ai',
}