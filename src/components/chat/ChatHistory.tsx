
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Trash2 } from 'lucide-react';
import { SettingsDialog } from './SettingsDialog';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface ChatSession {
  id: string;
  title: string;
  date: string;
  isActive?: boolean;
}

interface ChatHistoryProps {
  sessions: ChatSession[];
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession?: (id: string) => void;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({ 
  sessions, 
  onSelectSession,
  onNewChat,
  onDeleteSession
}) => {
  return (
    <aside className="h-full p-4 flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <Button 
          onClick={onNewChat}
          className="flex-1 bg-[#9b87f5] hover:bg-[#9b87f5]/90 text-white"
        >
          New Chat
        </Button>
        <div className="ml-2 flex gap-1">
          <ThemeToggle />
          <SettingsDialog />
        </div>
      </div>
      
      <div className="text-sm font-semibold text-[#1A1F2C]/60 mb-2 dark:text-[#d6bcfa]/70">
        {sessions.length > 0 ? 'Recent chats' : 'Start a new chat'}
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-2">
        {sessions.map((session) => (
          <div key={session.id} className="group relative">
            <Button
              variant={session.isActive ? "secondary" : "ghost"}
              className={`w-full justify-start text-left h-auto py-3 pr-10 ${
                session.isActive ? 'bg-[#9b87f5]/10' : ''
              }`}
              onClick={() => onSelectSession(session.id)}
            >
              <div className="flex items-start gap-3">
                <MessageCircle className="h-5 w-5 text-[#9b87f5] shrink-0 mt-0.5" />
                <div className="truncate">
                  <div className="font-medium truncate">{session.title}</div>
                  <div className="text-xs text-[#1A1F2C]/60 dark:text-[#d6bcfa]/60">{session.date}</div>
                </div>
              </div>
            </Button>
            {onDeleteSession && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                aria-label="Delete chat"
              >
                <Trash2 className="h-4 w-4 text-[#1A1F2C]/60 hover:text-red-500 dark:text-[#d6bcfa]/60 dark:hover:text-red-400" />
              </Button>
            )}
          </div>
        ))}
      </div>
      
      {sessions.length === 0 && (
        <div className="flex flex-col items-center justify-center text-[#1A1F2C]/60 text-sm p-4 mt-8 text-center dark:text-[#d6bcfa]/70">
          <MessageCircle className="h-12 w-12 text-[#9b87f5]/50 mb-3" />
          <p>Start a new chat to begin your conversation!</p>
        </div>
      )}
    </aside>
  );
};
