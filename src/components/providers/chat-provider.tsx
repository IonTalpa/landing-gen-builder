'use client';

import * as React from 'react';
import { ChatDrawer } from '@/components/chat/chat-drawer';
import type { Project } from '@/types';

interface ChatContextType {
  isOpen: boolean;
  openChat: (projectId?: string, project?: Project) => void;
  closeChat: () => void;
  toggleChat: (projectId?: string, project?: Project) => void;
}

const ChatContext = React.createContext<ChatContextType | undefined>(undefined);

export function useChatContext() {
  const context = React.useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}

interface ChatProviderProps {
  children: React.ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [projectId, setProjectId] = React.useState<string | undefined>();
  const [project, setProject] = React.useState<Project | undefined>();

  const openChat = React.useCallback((newProjectId?: string, newProject?: Project) => {
    setProjectId(newProjectId);
    setProject(newProject);
    setIsOpen(true);
  }, []);

  const closeChat = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleChat = React.useCallback((newProjectId?: string, newProject?: Project) => {
    if (isOpen) {
      closeChat();
    } else {
      openChat(newProjectId, newProject);
    }
  }, [isOpen, openChat, closeChat]);

  // Keyboard shortcut (Ctrl+K)
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'k') {
        event.preventDefault();
        toggleChat();
      }
      
      // Escape to close
      if (event.key === 'Escape' && isOpen) {
        closeChat();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggleChat, closeChat]);

  const contextValue = React.useMemo(
    () => ({
      isOpen,
      openChat,
      closeChat,
      toggleChat,
    }),
    [isOpen, openChat, closeChat, toggleChat]
  );

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
      <ChatDrawer
        isOpen={isOpen}
        onClose={closeChat}
        projectId={projectId}
        project={project}
      />
    </ChatContext.Provider>
  );
}