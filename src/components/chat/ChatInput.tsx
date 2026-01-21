import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizontal, Paperclip, X, FileText, Image, File } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface ChatInputProps {
  onSendMessage: (message: string, attachment?: File) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = 
        Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || attachment) && !isLoading) {
      // If there's an attachment but no message, add a placeholder message
      let finalMessage = message;
      if (attachment && !message.trim()) {
        finalMessage = `Please analyze this ${getFileTypeDescription(attachment)}`;
      }
      
      onSendMessage(finalMessage, attachment || undefined);
      setMessage('');
      setAttachment(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const getFileTypeDescription = (file: File): string => {
    if (file.type.startsWith('image/')) {
      return 'image';
    } else if (file.type === 'application/pdf') {
      return 'PDF document';
    } else if (file.type.includes('word') || file.type.includes('doc')) {
      return 'Word document';
    } else if (file.type === 'text/plain') {
      return 'text file';
    }
    return 'file';
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    } else if (file.type === 'application/pdf' || file.type.includes('word') || file.type.includes('doc')) {
      return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size must be less than 10MB');
        return;
      }
      setAttachment(file);
      toast.success(`File attached: ${file.name}`);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.info('Attachment removed');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto w-full">
      {/* Attachment Preview */}
      {attachment && (
        <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 dark:from-emerald-500/5 dark:to-teal-500/5 dark:border-emerald-500/10 backdrop-blur-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              {getFileIcon(attachment)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {attachment.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(attachment.size)}
              </p>
            </div>
            <button 
              type="button" 
              onClick={removeAttachment}
              className="flex-shrink-0 p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all duration-200"
              aria-label="Remove attachment"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Input Container */}
      <div className="relative flex items-end gap-2 p-2 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl shadow-gray-900/5 dark:shadow-black/20 transition-all duration-300 focus-within:border-emerald-500/50 focus-within:shadow-emerald-500/10">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt,.md,.json,.js,.ts,.css,.html"
        />
        
        {/* Attachment Button */}
        <Button 
          type="button"
          onClick={triggerFileInput}
          variant="ghost"
          size="icon"
          className="flex-shrink-0 h-10 w-10 rounded-xl text-gray-500 hover:text-emerald-600 hover:bg-emerald-500/10 dark:text-gray-400 dark:hover:text-emerald-400 dark:hover:bg-emerald-500/10 transition-all duration-200"
          aria-label="Attach file"
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        
        {/* Text Input */}
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-1 min-h-[44px] max-h-[150px] resize-none border-0 bg-transparent px-2 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          disabled={isLoading}
          rows={1}
        />
        
        {/* Send Button */}
        <Button 
          type="submit"
          disabled={(!message.trim() && !attachment) || isLoading}
          size="icon"
          className="flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:shadow-none transition-all duration-200 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          <SendHorizontal className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-300">AI is thinking...</span>
          </div>
        </div>
      )}
    </form>
  );
};
