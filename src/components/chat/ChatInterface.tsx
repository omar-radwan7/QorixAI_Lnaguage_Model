import React, { useState, useEffect, useRef } from 'react';
import { toast } from '@/components/ui/sonner';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatHistory } from './ChatHistory';
import { generateCompletion } from '@/services/ai-service';
import { Sparkles, MessageSquare, Zap, Brain, Code } from 'lucide-react';

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
    const savedSessions = localStorage.getItem('chat-sessions');
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
    localStorage.setItem('chat-sessions', JSON.stringify(sessions));
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
        { role: 'system' as const, content: 'You are a helpful AI assistant. Be concise and friendly in your responses. Always format code blocks properly using triple backticks with language specification.' },
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

      // Typing animation completion
      const calculatedDelay = Math.min(
        assistantResponse.includes("```") ? 300 : Math.min(assistantResponse.length * 1, 500),
        500
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

  const features = [
    { icon: Zap, title: "Lightning Fast", desc: "Get instant responses powered by AI" },
    { icon: Brain, title: "Smart Context", desc: "Understands context and nuance" },
    { icon: Code, title: "Code Ready", desc: "Syntax highlighting for code blocks" },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/20">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl dark:bg-emerald-500/5"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl dark:bg-teal-500/5"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-400/5 rounded-full blur-3xl dark:bg-emerald-400/3"></div>
      </div>

      {/* Mobile sidebar button */}
      <button 
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl text-gray-700 dark:text-gray-200 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:scale-105 transition-all duration-200"
      >
        {sidebarOpen ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>
      
      {/* Sidebar */}
      <div className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-800/50 transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 transition-transform duration-300 ease-out overflow-hidden shadow-xl md:shadow-none`}>
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
      <div className="flex-1 flex flex-col min-h-0 relative z-10">
        {/* Content area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 pb-8">
          {currentSession && currentSession.messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-2xl mx-auto px-4 animate-fade-in">
                {/* Hero Section */}
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-2xl shadow-emerald-500/30 mb-6">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent mb-4">
                    AI Chat Assistant
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    Your intelligent companion for questions, coding help, creative writing, and more.
                  </p>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {features.map((feature, index) => (
                    <div 
                      key={index}
                      className="p-5 rounded-2xl bg-white/60 dark:bg-gray-800/40 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 group"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                        <feature.icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{feature.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{feature.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Quick Prompts */}
                <div className="flex flex-wrap justify-center gap-2">
                  {["Explain quantum computing", "Write a poem about nature", "Help me debug code"].map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(prompt)}
                      className="px-4 py-2 rounded-full text-sm bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-300 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200 hover:scale-105"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
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
            </div>
          )}
        </div>
        
        {/* Input Area */}
        <div className="flex-shrink-0 p-4 md:p-6 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-800/50">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
      
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm md:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
