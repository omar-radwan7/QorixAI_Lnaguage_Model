interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletion {
  id: string;
  choices: {
    index: number;
    message: Message;
    finish_reason: string | null;
  }[];
}

// API Provider types
type ApiProvider = 'openrouter-qwen';

// Get API keys from local storage
const getStoredApiKey = (provider: 'openrouter'): string => {
  // Use the provided API key as fallback if none is stored
  return localStorage.getItem(`qorix_${provider}_api_key`) || 
    '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';
};

// Save API key to local storage
export const saveApiKey = (apiKey: string, provider: 'openrouter'): void => {
  localStorage.setItem(`qorix_${provider}_api_key`, apiKey);
};

// Get current provider preference from local storage or default to OpenRouter Qwen
export const getCurrentProvider = (): ApiProvider => {
  return (localStorage.getItem('qorix_api_provider') as ApiProvider) || 'openrouter-qwen';
};

// Set current provider preference
export const setCurrentProvider = (provider: ApiProvider): void => {
  localStorage.setItem('qorix_api_provider', provider);
};

// Fallback responses when the API is unavailable
const fallbackResponses = [
  "I'm sorry, but I can't connect right now. I'm Qorix AI, and I'll be able to assist you once the connection is restored.",
  "It seems my connection is currently unavailable. I'm Qorix AI operating in fallback mode.",
  "I apologize, but I'm currently in fallback mode. I'm Qorix AI, and I'll provide better assistance once the connection is restored.",
  "I'm currently running in offline mode. I'm Qorix AI, and I'll need your API key in settings to provide full functionality.",
  "Hello! I'm Qorix AI in fallback mode right now. To get full functionality, please add your API key in the settings."
];

// Process and analyze file content
const processFileContent = async (file: File): Promise<string> => {
  // For images, extract text using OCR
  if (file.type.startsWith('image/')) {
    try {
      // Create a placeholder for OCR - in a real implementation, this would use a service like Tesseract.js
      return `[Image analysis: This is a ${file.type.replace('image/', '')} image named "${file.name}" with size ${Math.round(file.size/1024)}KB]`;
    } catch (error) {
      console.error("Failed to process image:", error);
      return `[Unable to analyze image "${file.name}". Please describe its contents.]`;
    }
  }
  
  // For PDFs
  else if (file.type === 'application/pdf') {
    try {
      // Create a placeholder for PDF extraction - in a real implementation, this would use pdf.js
      return `[PDF analysis: This is a PDF document named "${file.name}" with size ${Math.round(file.size/1024)}KB]`;
    } catch (error) {
      console.error("Failed to process PDF:", error);
      return `[Unable to analyze PDF "${file.name}". Please describe its contents.]`;
    }
  }
  
  // For Word documents
  else if (file.type.includes('word') || file.type.includes('docx') || file.type.includes('doc')) {
    try {
      // Create a placeholder for Word extraction
      return `[Document analysis: This is a Word document named "${file.name}" with size ${Math.round(file.size/1024)}KB]`;
    } catch (error) {
      console.error("Failed to process Word document:", error);
      return `[Unable to analyze document "${file.name}". Please describe its contents.]`;
    }
  }
  
  // For text files
  else if (file.type === 'text/plain') {
    try {
      return await readTextFile(file);
    } catch (error) {
      console.error("Failed to read text file:", error);
      return `[Unable to read text file "${file.name}". Please provide the contents manually.]`;
    }
  }
  
  // Default case for unsupported file types
  return `[File received: "${file.name}" (${file.type}). This file type is not fully supported for analysis.]`;
};

// Helper function to read text files
const readTextFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(text.slice(0, 2000) + (text.length > 2000 ? '... (content truncated)' : ''));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

export const generateCompletion = async (messages: Message[], attachedFile?: File): Promise<string> => {
  const apiKey = getStoredApiKey('openrouter');
  
  // If no API key is set, return a message asking to set one
  if (!apiKey) {
    return `I'm Qorix AI. Please set your OpenRouter API key in the settings by clicking the gear icon in the sidebar.`;
  }
  
  try {
    // If there's an attached file, process it and add its content to the messages
    if (attachedFile) {
      try {
        const fileAnalysis = await processFileContent(attachedFile);
        
        // Add the file analysis as a system message
        const fileMessage: Message = {
          role: 'system',
          content: `The user has uploaded a file: ${attachedFile.name} (${attachedFile.type}). Here is the extracted content or analysis:\n\n${fileAnalysis}\n\nPlease reference this information in your response.`
        };
        
        // Insert the file message after the system message
        const sysMessageIndex = messages.findIndex(msg => msg.role === 'system');
        if (sysMessageIndex >= 0) {
          messages.splice(sysMessageIndex + 1, 0, fileMessage);
        } else {
          messages.unshift(fileMessage);
        }
      } catch (error) {
        console.error("Failed to process file:", error);
      }
    }
    
    // Strong system message to enforce identity and code formatting
    const systemMessage = "You are Qorix AI, a helpful assistant. Always identify yourself ONLY as Qorix AI. Be concise and direct in your responses. NEVER mention that you are made by any other company or that you are based on any specific model. You are simply Qorix AI. IMPORTANT: Always format code blocks properly using markdown triple backticks with language specification, for example: ```javascript console.log('Hello') ```. Remember: You are Qorix AI.";
    
    // Replace system message if present or add if not
    const modifiedMessages = messages.map(msg => {
      if (msg.role === 'system' && !msg.content.includes("user has uploaded a file")) {
        return { ...msg, content: systemMessage };
      }
      return msg;
    });
    
    if (!modifiedMessages.some(msg => msg.role === 'system')) {
      modifiedMessages.unshift({ role: 'system', content: systemMessage });
    }
    
    // Call the OpenRouter API with Qwen model
    return await generateOpenRouterCompletion(modifiedMessages, apiKey);
  } catch (error) {
    console.error("Failed to generate completion:", error);
    // Return a fallback response
    return getFallbackResponse(messages[messages.length - 1]?.content || "");
  }
};

// Generate completion using OpenRouter API with Qwen model
const generateOpenRouterCompletion = async (messages: Message[], apiKey: string): Promise<string> => {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Qorix AI Assistant"
      },
      body: JSON.stringify({
        model: "qwen/qwen3-235b-a22b:free",
        messages,
        temperature: 0.5, // Lower temperature for faster, more deterministic responses
        max_tokens: 600, // Further reduced for faster responses
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenRouter API error:", errorData);
      
      // Handle specific error types with more detailed messages
      if (errorData.error?.message?.includes("insufficient") || 
          errorData.error?.message?.includes("balance") ||
          errorData.error?.code === 402 ||
          errorData.error?.message?.includes("Rate limit")) {
        return "I'm Qorix AI. Your OpenRouter API quota has been exhausted or rate limited. Please try again later or check your account.";
      }
      
      if (errorData.error?.message?.includes("auth") ||
          errorData.error?.code === 401) {
        return "I'm Qorix AI. Authentication failed. Please check that your OpenRouter API key is valid and correctly entered in settings.";
      }
      
      // Return a random fallback response for other errors
      return getFallbackResponse(messages[messages.length - 1]?.content || "");
    }

    const data = await response.json() as ChatCompletion;
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling OpenRouter API:", error);
    return "I'm Qorix AI. There was a network error connecting to my services. Please check your internet connection and try again.";
  }
};

// Get a contextual fallback response
const getFallbackResponse = (userMessage: string): string => {
  // Pick a random fallback response
  const baseResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  
  // Add some context based on user's message
  let contextualAddition = "";
  
  // Add simple keyword detection to make fallback responses seem more relevant
  const lowercaseMsg = userMessage.toLowerCase();
  if (lowercaseMsg.includes("hello") || lowercaseMsg.includes("hi")) {
    contextualAddition = "\n\nI'm Qorix AI. How can I help you today?";
  } else if (lowercaseMsg.includes("help") || lowercaseMsg.includes("how")) {
    contextualAddition = "\n\nI'm Qorix AI, and I'd be happy to help when my connection is restored.";
  } else if (userMessage.endsWith("?")) {
    contextualAddition = "\n\nI'm Qorix AI, and I'll be able to answer your question once my connection is restored.";
  } else if (lowercaseMsg.includes("thank")) {
    contextualAddition = "\n\nYou're welcome! I'm Qorix AI, and I appreciate your understanding.";
  } else if (lowercaseMsg.includes("who are you") || lowercaseMsg.includes("what are you")) {
    contextualAddition = "\n\nI'm Qorix AI, your helpful assistant. I don't represent or belong to any other company.";
  }
  
  return baseResponse + contextualAddition;
};
