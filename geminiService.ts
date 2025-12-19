import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

let chatSession: Chat | null = null;

/**
 * Initializes and returns a new Gemini chat session.
 * @returns A promise that resolves to the initialized Chat object.
 */
export async function createChatSession(): Promise<Chat> {
  // Create a new instance of GoogleGenAI before each API call to ensure it uses the latest API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  chatSession = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `You are a friendly and knowledgeable AI assistant specialized in helping aspiring freelance full-stack developers. 
      Provide concise, actionable, and encouraging advice. 
      Cover topics like backend technologies (Node.js, Python, Java, databases), frontend technologies (React, Angular, Vue, TypeScript, CSS frameworks),
      freelancing strategies (finding clients, setting rates, portfolio building, communication), and general software development best practices.
      Use emojis to make responses more engaging.`,
    },
  });
  return chatSession;
}

/**
 * Sends a message to the Gemini chat session and streams the response.
 * @param message The user's message to send.
 * @param onChunkReceived Callback function to handle each chunk of the streamed response.
 * @returns A promise that resolves when the streaming is complete.
 */
export async function sendMessage(
  message: string,
  onChunkReceived: (chunk: string) => void,
): Promise<void> {
  if (!chatSession) {
    throw new Error("Chat session not initialized. Call createChatSession first.");
  }

  try {
    const streamResponse = await chatSession.sendMessageStream({ message: message });
    for await (const chunk of streamResponse) {
      const c = chunk as GenerateContentResponse;
      if (c.text) {
        onChunkReceived(c.text);
      }
    }
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    // If the error indicates a problem with the API key, try to reset the session.
    // This is a basic error handling. More sophisticated retry logic could be added.
    if (error instanceof Error && error.message.includes("Requested entity was not found.")) {
      console.warn("API key might be invalid or project not configured. Please check your API key.");
      chatSession = null; // Invalidate current session
      onChunkReceived("Oops! 😔 It seems there was an issue with the API. Please try again. If the problem persists, your API key might need to be re-selected from a paid project. (ai.google.dev/gemini-api/docs/billing)");
      // For Veo and Pro-Image models, we'd trigger window.aistudio.openSelectKey().
      // For general chat models like gemini-3-flash-preview, API_KEY is expected to be present via env.
    } else {
      onChunkReceived(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    throw error; // Re-throw to propagate the error if needed
  }
}
