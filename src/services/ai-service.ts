// Message content can be string or array for vision
type MessageContent = string | Array<{type: 'text', text: string} | {type: 'image_url', image_url: {url: string}}>;

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: MessageContent;
}

interface ChatCompletion {
  id: string;
  choices: {
    index: number;
    message: { role: string; content: string };
    finish_reason: string | null;
  }[];
}

// Get API key from environment or local storage
const getApiKey = (): string => {
  return localStorage.getItem('openrouter_api_key') || import.meta.env.VITE_OPENROUTER_API_KEY || '';
};

// Save API key to local storage
export const saveApiKey = (apiKey: string): void => {
  localStorage.setItem('openrouter_api_key', apiKey);
};

// These exports are kept for compatibility
export const getCurrentProvider = () => 'openrouter';
export const setCurrentProvider = () => {};

// Convert file to base64 data URL
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

// Read text files
const readTextFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(text.slice(0, 10000) + (text.length > 10000 ? '\n... (truncated)' : ''));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

export const generateCompletion = async (messages: Message[], attachedFile?: File): Promise<string> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return 'Please set your OpenRouter API key in settings.';
  }
  
  try {
    let apiMessages: Message[] = [...messages];
    
    // System message
    const systemMessage = "You are a helpful AI assistant. Be concise and helpful. Format code with triple backticks and language name. When analyzing images, describe what you see in detail.";
    
    // Ensure system message exists
    if (!apiMessages.some(m => m.role === 'system')) {
      apiMessages = [{ role: 'system', content: systemMessage }, ...apiMessages];
    }
    
    // Handle attached file
    if (attachedFile) {
      // For images - send as vision content
      if (attachedFile.type.startsWith('image/')) {
        const base64Data = await fileToBase64(attachedFile);
        
        // Find the last user message and add image to it
        const lastUserMsgIndex = apiMessages.map(m => m.role).lastIndexOf('user');
        if (lastUserMsgIndex >= 0) {
          const lastUserMsg = apiMessages[lastUserMsgIndex];
          const textContent = typeof lastUserMsg.content === 'string' 
            ? lastUserMsg.content 
            : lastUserMsg.content.find(c => c.type === 'text')?.text || '';
          
          apiMessages[lastUserMsgIndex] = {
            role: 'user',
            content: [
              { type: 'text', text: textContent || 'What is in this image?' },
              { type: 'image_url', image_url: { url: base64Data } }
            ]
          };
        }
      }
      // For text/code files
      else if (attachedFile.type === 'text/plain' || /\.(txt|md|json|js|ts|css|html|py|java|c|cpp|go|rs)$/i.test(attachedFile.name)) {
        const content = await readTextFile(attachedFile);
        const lastUserMsgIndex = apiMessages.map(m => m.role).lastIndexOf('user');
        if (lastUserMsgIndex >= 0) {
          const lastUserMsg = apiMessages[lastUserMsgIndex];
          const existingText = typeof lastUserMsg.content === 'string' ? lastUserMsg.content : '';
          apiMessages[lastUserMsgIndex] = {
            role: 'user',
            content: `${existingText}\n\n[File: ${attachedFile.name}]\n\`\`\`\n${content}\n\`\`\``
          };
        }
      }
      // For other files
      else {
        const lastUserMsgIndex = apiMessages.map(m => m.role).lastIndexOf('user');
        if (lastUserMsgIndex >= 0) {
          const lastUserMsg = apiMessages[lastUserMsgIndex];
          const existingText = typeof lastUserMsg.content === 'string' ? lastUserMsg.content : '';
          apiMessages[lastUserMsgIndex] = {
            role: 'user',
            content: `${existingText}\n\n[Attached file: ${attachedFile.name} (${attachedFile.type})]`
          };
        }
      }
    }
    
    // Make API request to OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "AI Chat Assistant"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API error:", errorData);
      return `Error: ${errorData.error?.message || 'Request failed'}`;
    }

    const data = await response.json() as ChatCompletion;
    return data.choices[0].message.content;
    
  } catch (error) {
    console.error("Error:", error);
    return `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};
