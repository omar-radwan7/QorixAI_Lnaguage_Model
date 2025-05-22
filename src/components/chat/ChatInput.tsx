
import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizontal, Paperclip } from 'lucide-react';
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB');
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
  };

  return (
    <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto w-full">
      {attachment && (
        <div className="mb-2 p-2 border border-[#9b87f5]/30 rounded-md bg-[#9b87f5]/5 flex items-center justify-between dark:bg-[#7E69AB]/10 dark:border-[#7E69AB]/30">
          <span className="text-sm truncate">{attachment.name}</span>
          <button 
            type="button" 
            onClick={removeAttachment}
            className="text-[#9b87f5] hover:text-[#7E69AB] dark:text-[#9b87f5] dark:hover:text-[#d6bcfa]"
          >
            ×
          </button>
        </div>
      )}
      <div className="relative flex items-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
        <Button 
          type="button"
          onClick={triggerFileInput}
          className="absolute left-2 h-9 w-9 rounded-full bg-transparent p-2 text-[#9b87f5] hover:bg-[#9b87f5]/10 transition-colors z-10 dark:text-[#d6bcfa] dark:hover:bg-[#7E69AB]/20"
          aria-label="Attach file"
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Qorix AI..."
          className="min-h-[48px] max-h-[150px] w-full resize-none rounded-xl border-[#9b87f5]/30 pl-12 pr-12 shadow-sm focus:border-[#9b87f5] focus:ring-[#9b87f5]/20 transition-all dark:border-[#7E69AB]/30 dark:focus:border-[#9b87f5] dark:focus:ring-[#7E69AB]/20 dark:bg-[#282c34] dark:text-[#d6bcfa]"
          disabled={isLoading}
          rows={1}
        />
        <Button 
          type="submit"
          disabled={(!message.trim() && !attachment) || isLoading}
          className="absolute right-2 h-9 w-9 rounded-full bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] p-2 transition-opacity hover:opacity-90"
          aria-label="Send message"
        >
          <SendHorizontal className="h-5 w-5" />
        </Button>
      </div>
      <div className="absolute bottom-full right-0 mb-2 text-xs text-gray-500 dark:text-gray-400">
        {isLoading && (
          <span className="animate-pulse-slow">Qorix AI is thinking...</span>
        )}
      </div>
    </form>
  );
};
