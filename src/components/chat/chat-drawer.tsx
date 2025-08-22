'use client';

import * as React from 'react';
import { X, Send, MessageSquare, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { ChatMessage, ToolResult, Project, ApiResponse } from '@/types';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  project?: Project;
}

interface ChatUIMessage {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  timestamp: Date;
  toolResults?: ToolResult[];
  isLoading?: boolean;
}

export function ChatDrawer({ isOpen, onClose, projectId, project }: ChatDrawerProps) {
  const [messages, setMessages] = React.useState<ChatUIMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  // Load chat history when drawer opens
  React.useEffect(() => {
    if (isOpen && projectId) {
      loadChatHistory();
    }
  }, [isOpen, projectId]);

  // Scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const loadChatHistory = async () => {
    if (!projectId) return;

    try {
      const response = await fetch(`/api/chat?projectId=${projectId}`);
      const data: ApiResponse<{ messages: ChatMessage[] }> = await response.json();
      
      if (data.success && data.data?.messages) {
        const uiMessages: ChatUIMessage[] = data.data.messages.map(msg => ({
          id: msg.id || `msg-${Date.now()}-${Math.random()}`,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.createdAt),
        }));
        setMessages(uiMessages);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatUIMessage = {
      id: `user-${Date.now()}`,
      role: 'USER',
      content: input.trim(),
      timestamp: new Date(),
    };

    const loadingMessage: ChatUIMessage = {
      id: `loading-${Date.now()}`,
      role: 'ASSISTANT',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          projectId,
        }),
      });

      const data: ApiResponse<{
        message: ChatMessage;
        toolResults?: ToolResult[];
      }> = await response.json();

      if (data.success && data.data?.message) {
        const assistantMessage: ChatUIMessage = {
          id: data.data.message.id || `ai-${Date.now()}`,
          role: 'ASSISTANT',
          content: data.data.message.content,
          timestamp: new Date(data.data.message.createdAt),
          toolResults: data.data.toolResults,
        };

        setMessages(prev => prev.slice(0, -1).concat(assistantMessage));
      } else {
        // Error handling
        const errorMessage: ChatUIMessage = {
          id: `error-${Date.now()}`,
          role: 'ASSISTANT',
          content: data.error || 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
          timestamp: new Date(),
        };
        setMessages(prev => prev.slice(0, -1).concat(errorMessage));
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatUIMessage = {
        id: `error-${Date.now()}`,
        role: 'ASSISTANT',
        content: 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.',
        timestamp: new Date(),
      };
      setMessages(prev => prev.slice(0, -1).concat(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-semibold">AI Assistant</h2>
              {project && (
                <p className="text-xs text-muted-foreground">{project.name}</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex flex-col h-[calc(100vh-8rem)]">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">WordPress Asistanı</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Merhaba! WordPress tema geliştirme konusunda size nasıl yardımcı olabilirim?
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3',
                      message.role === 'USER' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'ASSISTANT' && (
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    )}
                    
                    <div
                      className={cn(
                        'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                        message.role === 'USER'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      {message.isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Düşünüyor...</span>
                        </div>
                      ) : (
                        <>
                          <div className="whitespace-pre-wrap">{message.content}</div>
                          
                          {/* Tool Results */}
                          {message.toolResults && message.toolResults.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {message.toolResults.map((tool, index) => (
                                <div
                                  key={index}
                                  className="text-xs bg-background/50 rounded p-2 border"
                                >
                                  <div className="font-medium text-primary">
                                    {tool.tool}
                                  </div>
                                  <div className="mt-1 text-muted-foreground">
                                    {typeof tool.result === 'object'
                                      ? JSON.stringify(tool.result, null, 2)
                                      : String(tool.result)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatTime(message.timestamp)}
                          </div>
                        </>
                      )}
                    </div>

                    {message.role === 'USER' && (
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Bir soru sorun..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                size="sm"
                className="px-3"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              WordPress geliştirme, tema optimizasyonu ve içerik önerileri hakkında sorular sorabilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}