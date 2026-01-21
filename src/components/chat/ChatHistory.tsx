import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Trash2, Plus, Sparkles } from 'lucide-react';
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
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="font-semibold text-gray-900 dark:text-white">AI Chat</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Assistant</p>
        </div>
      </div>

      {/* New Chat Button */}
      <Button 
        onClick={onNewChat}
        className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 mb-6 group"
      >
        <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
        New Chat
      </Button>
      
      {/* Sessions List */}
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">
        {sessions.length > 0 ? 'Recent Conversations' : 'No conversations yet'}
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 -mr-1">
        {sessions.map((session) => (
          <div key={session.id} className="group relative">
            <button
              className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                session.isActive 
                  ? 'bg-emerald-500/10 border border-emerald-500/20 shadow-sm' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800/50 border border-transparent'
              }`}
              onClick={() => onSelectSession(session.id)}
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  session.isActive 
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}>
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <div className={`font-medium truncate text-sm ${
                    session.isActive 
                      ? 'text-emerald-700 dark:text-emerald-400' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {session.title}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {session.date}
                  </div>
                </div>
              </div>
            </button>
            {onDeleteSession && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 hover:bg-red-500/10 dark:text-gray-500 dark:hover:text-red-400"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                aria-label="Delete chat"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {sessions.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center mb-4">
            <MessageCircle className="h-8 w-8 text-emerald-500/50" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Start a new chat to begin your conversation!
          </p>
        </div>
      )}
      
      {/* Footer Actions */}
      <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-800/50">
        <div className="flex items-center justify-between">
          <ThemeToggle />
          <SettingsDialog />
        </div>
      </div>
    </aside>
  );
};
