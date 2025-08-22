'use client';

import React, { useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { Loader2, ArrowLeft, Save, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/layout/app-header';
import { TabNavigation } from '@/components/project/tab-navigation';
import { useChatContext } from '@/components/providers/chat-provider';
import type { Project, TabName } from '@/types';

interface ProjectLayoutProps {
  children: React.ReactNode;
}

export function ProjectLayout({ children }: ProjectLayoutProps) {
  const params = useParams();
  const pathname = usePathname();
  const projectId = params.id as string;
  const { openChat } = useChatContext();
  
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract current tab from pathname
  const currentTab = pathname.split('/').pop() as TabName || 'details';

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();
      
      if (data.success) {
        setProject(data.data);
      } else {
        setError(data.error || 'Failed to fetch project');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProject = async (updates: Partial<Project>) => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (data.success) {
        setProject(data.data);
        setHasUnsavedChanges(false);
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to update project');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Update failed');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const saveProject = async () => {
    if (!hasUnsavedChanges || !project) return;
    
    try {
      await updateProject(project);
    } catch (error) {
      // Error is already handled in updateProject
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Project Not Found</h2>
            <p className="text-muted-foreground mb-6">
              {error || 'The project you\'re looking for doesn\'t exist.'}
            </p>
            <Link href="/">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      {/* Project Header */}
      <div className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Projects
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">{project.name}</h1>
                {project.sector && (
                  <p className="text-sm text-muted-foreground">{project.sector}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <Button 
                  onClick={saveProject} 
                  disabled={isSaving}
                  size="sm"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <TabNavigation projectId={projectId} activeTab={currentTab} />

      {/* Tab Content */}
      <div className="container mx-auto px-4 py-8">
        {React.cloneElement(children as React.ReactElement, {
          project,
          updateProject,
          hasUnsavedChanges,
          setHasUnsavedChanges,
        })}
      </div>

      {/* Floating Project Chat Button */}
      <Button
        onClick={() => openChat(projectId, project)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-40"
        size="sm"
        title="Chat about this project"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    </div>
  );
}