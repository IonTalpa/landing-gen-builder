'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { 
  Settings, 
  Palette, 
  Image, 
  FileText, 
  Layout, 
  Zap, 
  Eye, 
  Download 
} from 'lucide-react';
import type { TabName } from '@/types';

interface TabNavigationProps {
  projectId: string;
  activeTab: TabName;
}

const tabs = [
  { id: 'details', label: 'Details', icon: Settings },
  { id: 'brand', label: 'Brand', icon: Palette },
  { id: 'assets', label: 'Assets', icon: Image },
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'layout', label: 'Layout', icon: Layout },
  { id: 'generate', label: 'Generate', icon: Zap },
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'export', label: 'Export', icon: Download },
] as const;

export function TabNavigation({ projectId, activeTab }: TabNavigationProps) {
  const router = useRouter();

  const handleTabChange = (tabId: TabName) => {
    router.push(`/project/${projectId}/${tabId}`);
  };

  return (
    <div className="border-b border-border bg-background">
      <div className="container mx-auto px-4">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as TabName)}
                className={clsx(
                  'flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}