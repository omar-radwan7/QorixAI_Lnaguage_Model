
import React, { useState, useEffect, useRef } from 'react';
import { toast } from '@/components/ui/sonner';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatHistory } from './ChatHistory';
import { generateCompletion } from '@/services/ai-service';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  isTyping?: boolean;
  attachment?: {
    name: string;
    url: string;
    type: string;
  };
}

interface Session {
  id: string;
  title: string;
  date: string;
  messages: Message[];
}

export const ChatInterface: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>(() => {
    // Load sessions from localStorage if available
    const savedSessions = localStorage.getItem('qorix-sessions');
    if (savedSessions) {
      try {
        return JSON.parse(savedSessions);
      } catch (e) {
        console.error('Error parsing saved sessions', e);
        return [];
      }
    }
    return [];
  });
  
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    if (sessions.length > 0) {
      return sessions[0].id;
    }
    return Date.now().toString();
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize with a session if none exists
    if (sessions.length === 0) {
      const newSession = {
        id: currentSessionId,
        title: 'New Conversation',
        date: new Date().toLocaleDateString(),
        messages: []
      };
      setSessions([newSession]);
    }
  }, []);

  useEffect(() => {
    // Save sessions to localStorage when they change
    localStorage.setItem('qorix-sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    scrollToBottom();
  }, [sessions]);

  const getCurrentSession = () => {
    return sessions.find(s => s.id === currentSessionId) || sessions[0];
  };

  // Optimize scrolling
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  };

  const createNewChat = () => {
    const newSessionId = Date.now().toString();
    const newSession = {
      id: newSessionId,
      title: 'New Conversation',
      date: new Date().toLocaleDateString(),
      messages: []
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSessionId);
    setSidebarOpen(false);
  };
  
  const deleteSession = (sessionId: string) => {
    setSessions(prev => {
      const updatedSessions = prev.filter(session => session.id !== sessionId);
      
      // If we're deleting the current session, switch to another one
      if (sessionId === currentSessionId && updatedSessions.length > 0) {
        setCurrentSessionId(updatedSessions[0].id);
      } else if (updatedSessions.length === 0) {
        // Create a new session if we deleted the last one
        createNewChat();
      }
      
      return updatedSessions;
    });
  };
  
  const selectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setSidebarOpen(false);
  };

  const handleSendMessage = async (content: string, attachment?: File) => {
    if (!content.trim() && !attachment) return;

    // Generate message ID
    const userMessageId = `user_${Date.now()}`;
    
    let userMessage: Message = { 
      id: userMessageId, 
      content, 
      isUser: true 
    };
    
    // If there's an attachment, add it to the message
    if (attachment) {
      const fileType = attachment.type;
      const fileUrl = URL.createObjectURL(attachment);
      
      userMessage.attachment = {
        name: attachment.name,
        url: fileUrl,
        type: fileType
      };
    }
    
    const currentSession = getCurrentSession();
    // Add user message to current session
    const updatedMessages = [
      ...currentSession.messages,
      userMessage
    ];
    
    // Update title if it's the first message
    const title = currentSession.messages.length === 0 
      ? content.slice(0, 25) + (content.length > 25 ? '...' : '')
      : currentSession.title;
    
    setSessions(prev => prev.map(session => 
      session.id === currentSessionId
        ? { ...session, messages: updatedMessages, title }
        : session
    ));

    try {
      setIsLoading(true);
      
      // Prepare messages for API
      const apiMessages = updatedMessages.map(msg => ({
        role: msg.isUser ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));
      
      // Add system message
      const messages = [
        { role: 'system' as const, content: 'You are Qorix AI, a helpful assistant. Always identify yourself only as Qorix AI. Be concise and friendly in your responses. Never mention that you are made by any other company or that you are based on any specific model. You are simply Qorix AI. Always format code blocks properly using triple backticks with language specification.' },
        ...apiMessages
      ];
      
      // Add placeholder for AI response with typing animation
      const assistantId = `assistant_${Date.now()}`;
      setSessions(prev => prev.map(session => 
        session.id === currentSessionId
          ? { 
              ...session, 
              messages: [
                ...session.messages, 
                { id: assistantId, content: '', isUser: false, isTyping: true }
              ]
            }
          : session
      ));
      
      // Get AI response with attachment if provided
      const assistantResponse = await generateCompletion(messages, attachment);
      
      // Update with final response
      setSessions(prev => {
        return prev.map(session => 
          session.id === currentSessionId
            ? { 
                ...session, 
                messages: session.messages.map(msg => 
                  msg.id === assistantId 
                    ? { ...msg, content: assistantResponse, isTyping: true } 
                    : msg
                )
              }
            : session
        );
      });

      // Much faster typing animation completion - even faster now
      const calculatedDelay = Math.min(
        // Calculate based on content length, but with a much lower multiplier
        // and cap the maximum delay at 500ms (0.5 second)
        assistantResponse.includes("```") ? 300 : Math.min(assistantResponse.length * 1, 500),
        500 // Never wait more than 0.5 second
      );
      
      setTimeout(() => {
        setSessions(prev => {
          return prev.map(session => 
            session.id === currentSessionId
              ? { 
                  ...session, 
                  messages: session.messages.map(msg => 
                    msg.id === assistantId 
                      ? { ...msg, isTyping: false } 
                      : msg
                  )
                }
              : session
          );
        });
      }, calculatedDelay);
      
    } catch (error) {
      console.error('Error generating response:', error);
      toast.error('An unexpected error occurred. Please try again.');
      
      // Remove loading message if error occurs
      setSessions(prev => {
        return prev.map(session => 
          session.id === currentSessionId
            ? { 
                ...session, 
                messages: session.messages.filter(msg => !msg.isTyping)
              }
            : session
        );
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
    // Find the current session
    const currentSession = getCurrentSession();
    if (!currentSession) return;
    
    // Find the message index
    const messageIndex = currentSession.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;
    
    // Only user messages can be edited
    const message = currentSession.messages[messageIndex];
    if (!message.isUser) return;
    
    // Update the message
    const updatedMessages = [...currentSession.messages];
    updatedMessages[messageIndex] = { ...message, content: newContent };
    
    // Remove all AI messages after this one
    const messagesToKeep = updatedMessages.slice(0, messageIndex + 1);
    
    // Update the session
    setSessions(prev => prev.map(session => 
      session.id === currentSessionId
        ? { ...session, messages: messagesToKeep }
        : session
    ));
    
    // Let the user know they should resend to get a new response
    toast.info("Message updated. Send a message to get a new response.");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const currentSession = getCurrentSession();

  return (
    <div className="flex h-screen bg-white dark:bg-[#1A1F2C]">
      {/* Mobile sidebar button */}
      <button 
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#9b87f5] text-white rounded-full shadow-lg dark:bg-[#7E69AB]"
      >
        {sidebarOpen ? '×' : '≡'}
      </button>
      
      {/* Sidebar */}
      <div className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-[#9b87f5]/10 transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 transition-transform duration-200 ease-in-out overflow-hidden dark:bg-[#1A1F2C] dark:border-[#7E69AB]/20`}>
        <ChatHistory 
          sessions={sessions.map(session => ({
            id: session.id,
            title: session.title,
            date: session.date,
            isActive: session.id === currentSessionId
          }))}
          onSelectSession={selectSession}
          onNewChat={createNewChat}
          onDeleteSession={deleteSession}
        />
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6 pb-16 md:pb-20">
          {currentSession && currentSession.messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md mx-auto px-4">
                <h2 className="text-xl font-bold mb-2 text-[#1A1F2C] dark:text-[#9b87f5]">Welcome to Qorix AI</h2>
                <p className="text-[#1A1F2C]/70 mb-6 dark:text-[#d6bcfa]">
                  How can I help you today? Ask me anything and I'll do my best to assist you.
                </p>
              </div>
            </div>
          ) : (
            <>
              {currentSession && currentSession.messages.map((message) => (
                <ChatMessage 
                  key={message.id} 
                  content={message.content} 
                  isUser={message.isUser}
                  isLoading={isLoading && message.id === currentSession.messages[currentSession.messages.length - 1].id && !message.isUser}
                  isTyping={message.isTyping}
                  attachment={message.attachment}
                  messageId={message.id}
                  onEditMessage={handleEditMessage}
                />
              ))}
              
              {isLoading && currentSession && !currentSession.messages.some(m => m.isTyping) && (
                <ChatMessage 
                  content="" 
                  isUser={false} 
                  isLoading={true} 
                />
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        <div className="p-3 border-t border-[#9b87f5]/10 fixed bottom-0 left-0 right-0 bg-white md:static dark:bg-[#1A1F2C] dark:border-[#7E69AB]/20">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
      
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 md:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
