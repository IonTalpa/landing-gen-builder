'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Zap, MessageSquare } from 'lucide-react';
import { Button } from '../ui/button';
import { ThemeToggle } from '../ui/theme-toggle';
import { useChatContext } from '../providers/chat-provider';

export function AppHeader() {
  const router = useRouter();
  const { toggleChat } = useChatContext();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleChatToggle = () => {
    toggleChat();
  };

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
            <Zap className="h-5 w-5 text-primary" />
            Landing-Gen
          </Link>
          
          <nav className="hidden md:flex items-center gap-4">
            <Link 
              href="/" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Projects
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleChatToggle}
            className="hidden md:flex items-center gap-2"
            title="Open chat assistant (Ctrl+K)"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden lg:inline">Chat</span>
          </Button>
          
          <ThemeToggle />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}