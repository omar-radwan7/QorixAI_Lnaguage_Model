
import React, { useState, useEffect, useRef } from 'react';
import { User, Bot, Copy, Check, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  isLoading?: boolean;
  isTyping?: boolean;
  attachment?: {
    name: string;
    url: string;
    type: string;
  };
  messageId?: string;
  onEditMessage?: (messageId: string, newContent: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  content, 
  isUser, 
  isLoading = false,
  isTyping = false,
  attachment,
  messageId,
  onEditMessage
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [isCopied, setIsCopied] = useState<{[key: string]: boolean}>({});
  const messageRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Function to format code blocks with proper syntax highlighting
  const formatMessageWithCodeBlocks = (text: string) => {
    if (!text) return '';

    // Split the text by code blocks
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      // Check if this part is a code block
      if (part.startsWith('```') && part.endsWith('```')) {
        // Extract language and code
        const match = part.match(/```([a-zA-Z]*)?\n([\s\S]*?)```/);
        
        if (match) {
          const language = match[1] || '';
          const code = match[2] || '';
          const codeId = `code-${index}-${messageId || Math.random().toString(36).substring(7)}`;
          
          return (
            <div key={index} className="relative my-4 bg-gray-50 rounded-md overflow-hidden border dark:border-gray-700 dark:bg-gray-900">
              <div className="flex justify-between items-center bg-gray-100 px-4 py-2 text-xs font-mono text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-b dark:border-gray-700">
                {language && (
                  <span className="text-gray-500">{language}</span>
                )}
                <button 
                  onClick={() => copyToClipboard(code, codeId)}
                  className="flex items-center gap-1 hover:text-[#9b87f5] transition-colors"
                  aria-label={isCopied[codeId] ? "Copied" : "Copy code"}
                >
                  {isCopied[codeId] ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-sm bg-gray-50 dark:bg-gray-900 dark:text-gray-300">
                <code>{code}</code>
              </pre>
            </div>
          );
        }
      }
      
      // For regular text, just return with newlines converted to <br>
      return (
        <span key={index} className="whitespace-pre-wrap">
          {part}
        </span>
      );
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied({...isCopied, [id]: true});
      setTimeout(() => {
        setIsCopied({...isCopied, [id]: false});
      }, 2000);
    });
  };

  // Simulated typing effect with a much faster speed
  useEffect(() => {
    if (isTyping && !isUser) {
      let currentIndex = 0;
      const intervalId = setInterval(() => {
        if (currentIndex <= content.length) {
          setDisplayedContent(content.substring(0, currentIndex));
          currentIndex += 5; // Increased characters per tick for much faster typing
        } else {
          clearInterval(intervalId);
        }
      }, 5); // Very small interval for faster typing

      return () => {
        clearInterval(intervalId);
        setDisplayedContent(content);
      };
    } else {
      setDisplayedContent(content);
    }
  }, [content, isTyping, isUser]);

  // Focus the textarea when editing
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isEditing]);

  const handleSaveEdit = () => {
    if (onEditMessage && messageId) {
      onEditMessage(messageId, editedContent);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  const renderAttachment = () => {
    if (!attachment) return null;

    // Handle image attachments
    if (attachment.type.startsWith('image/')) {
      return (
        <div className="mt-2 max-w-xs">
          <img 
            src={attachment.url} 
            alt={attachment.name} 
            className="rounded-md max-h-64 object-contain"
          />
          <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">{attachment.name}</div>
        </div>
      );
    }

    // Handle other file types with a generic attachment display
    return (
      <div className="mt-2 p-2 border rounded-md inline-flex items-center gap-2 bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 6 0V7.5" />
          <path d="M14 3a3 3 0 0 0-3 3v12a3 3 0 0 0 6 0V7.5" />
          <path d="M4 12h8" />
          <path d="M8 8v8" />
        </svg>
        <a 
          href={attachment.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-blue-500 hover:underline dark:text-[#9b87f5]"
        >
          {attachment.name}
        </a>
      </div>
    );
  };

  return (
    <div 
      ref={messageRef}
      className={`flex mb-4 animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex max-w-[80%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-[#9b87f5] text-white ml-2 dark:bg-[#7E69AB]' 
            : 'bg-gray-200 text-gray-600 mr-2 dark:bg-[#282c34] dark:text-[#9b87f5]'
        }`}>
          {isUser ? (
            <User size={16} />
          ) : (
            <Bot size={16} />
          )}
        </div>

        <div className={`rounded-lg p-3 shadow-sm relative group ${
          isUser 
            ? 'bg-[#9b87f5] text-white dark:bg-[#7E69AB]' 
            : 'bg-white text-gray-800 dark:bg-[#282c34] dark:text-[#d6bcfa]'
        }`}>
          {isLoading ? (
            <div className="flex items-center space-x-1 h-5">
              <div className="w-2 h-2 rounded-full bg-current animate-blink"></div>
              <div className="w-2 h-2 rounded-full bg-current animate-blink" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 rounded-full bg-current animate-blink" style={{ animationDelay: '0.4s' }}></div>
            </div>
          ) : isEditing ? (
            <div className="w-full">
              <textarea
                ref={textareaRef}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full p-2 rounded-md border focus:outline-none focus:ring-1 focus:ring-[#9b87f5] bg-white text-gray-800 dark:bg-[#1e2430] dark:text-[#d6bcfa] dark:border-gray-700"
                rows={3}
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleCancelEdit}
                  className="text-xs dark:border-gray-700 dark:bg-[#1e2430] dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSaveEdit}
                  className="bg-[#9b87f5] hover:bg-[#9b87f5]/90 text-white text-xs"
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="prose-sm md:prose max-w-none dark:prose-invert">
                {isTyping ? displayedContent : formatMessageWithCodeBlocks(content)}
                {renderAttachment()}
              </div>
              
              {isUser && onEditMessage && messageId && !isLoading && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#9b87f5]/10 hover:bg-[#9b87f5]/20"
                  onClick={() => setIsEditing(true)}
                  aria-label="Edit message"
                >
                  <Edit className="h-3 w-3 text-white" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
