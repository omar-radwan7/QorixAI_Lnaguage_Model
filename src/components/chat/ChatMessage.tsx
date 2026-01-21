import React, { useState, useEffect, useRef } from 'react';
import { User, Bot, Copy, Check, Edit, FileText, Image as ImageIcon, File } from 'lucide-react';
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
        const match = part.match(/```([a-zA-Z]*)?\n?([\s\S]*?)```/);
        
        if (match) {
          const language = match[1] || '';
          const code = match[2] || '';
          const codeId = `code-${index}-${messageId || Math.random().toString(36).substring(7)}`;
          
          return (
            <div key={index} className="relative my-4 rounded-xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
              <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 px-4 py-2.5 border-b border-gray-200/50 dark:border-gray-700/50">
                {language && (
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">{language}</span>
                )}
                {!language && <span></span>}
                <button 
                  onClick={() => copyToClipboard(code, codeId)}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors"
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
              <pre className="p-4 overflow-x-auto text-sm bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-mono leading-relaxed">
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
      toast.success('Copied to clipboard');
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
          currentIndex += 8; // Even faster typing
        } else {
          clearInterval(intervalId);
        }
      }, 5);

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

  const getAttachmentIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (type === 'application/pdf' || type.includes('word') || type.includes('doc')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const renderAttachment = () => {
    if (!attachment) return null;

    // Handle image attachments
    if (attachment.type.startsWith('image/')) {
      return (
        <div className="mt-3 max-w-sm">
          <img 
            src={attachment.url} 
            alt={attachment.name} 
            className="rounded-xl max-h-64 object-contain shadow-lg"
          />
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <ImageIcon className="h-3 w-3" />
            {attachment.name}
          </div>
        </div>
      );
    }

    // Handle other file types with a generic attachment display
    return (
      <div className="mt-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 inline-flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          {getAttachmentIcon(attachment.type)}
        </div>
        <div>
          <a 
            href={attachment.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm font-medium text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            {attachment.name}
          </a>
          <p className="text-xs text-gray-500 dark:text-gray-400">Click to open</p>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={messageRef}
      className={`flex mb-6 animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex max-w-[85%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center shadow-lg ${
            isUser 
              ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-violet-500/25' 
              : 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-emerald-500/25'
          }`}>
            {isUser ? (
              <User size={16} />
            ) : (
              <Bot size={16} />
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className={`rounded-2xl px-4 py-3 relative group ${
          isUser 
            ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/20' 
            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-lg shadow-gray-900/5 dark:shadow-black/20 border border-gray-100 dark:border-gray-700/50'
        }`}>
          {isLoading ? (
            <div className="flex items-center space-x-2 h-6 px-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          ) : isEditing ? (
            <div className="w-full min-w-[300px]">
              <textarea
                ref={textareaRef}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 resize-none"
                rows={3}
              />
              <div className="flex justify-end gap-2 mt-3">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleCancelEdit}
                  className="rounded-lg text-xs"
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSaveEdit}
                  className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs"
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2">
                {isTyping ? displayedContent : formatMessageWithCodeBlocks(content)}
                {renderAttachment()}
              </div>
              
              {isUser && onEditMessage && messageId && !isLoading && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-2 -right-2 h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-700 shadow-md hover:bg-gray-50 dark:hover:bg-gray-600"
                  onClick={() => setIsEditing(true)}
                  aria-label="Edit message"
                >
                  <Edit className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
