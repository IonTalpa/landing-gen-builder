'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, Clock, Palette, Type, Image, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import type { Project, Generated } from '@/types';

interface GenerateTabProps {
  project?: Project;
  updateProject?: (updates: Partial<Project>) => Promise<Project>;
  setHasUnsavedChanges?: (has: boolean) => void;
}

export default function GenerateTab({ 
  project
}: GenerateTabProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Generated | null>(null);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (project?.generated && project.generated.length > 0) {
      setLastGenerated(project.generated[0]);
    }
  }, [project]);

  const validateProjectData = (): { isValid: boolean; issues: string[] } => {
    const issues: string[] = [];
    
    if (!project?.name) {
      issues.push('Project name is required');
    }
    
    if (!project?.brand?.palette || project.brand.palette.length === 0) {
      issues.push('At least one brand color is required');
    }
    
    if (!project?.content?.headline) {
      issues.push('A headline is recommended for better results');
    }
    
    if (!project?.layout?.sections || project.layout.sections.length === 0) {
      issues.push('At least one layout section is required');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  };

  const handleGenerate = async (forceRegenerate = false) => {
    if (!project) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          forceRegenerate,
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Generation failed');
      }
      
      setLastGenerated(data.data.generated);
      setGenerationTime(data.data.generationTime);
      
      if (!data.data.isFromCache) {
        // Refresh project data to get the new generation
        window.location.reload();
      }
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatGenerationTime = (time: number | null): string => {
    if (!time) return 'Unknown';
    return time < 1000 ? `${time}ms` : `${(time / 1000).toFixed(1)}s`;
  };

  const getProjectCompleteness = (): { percentage: number; completedSteps: string[]; missingSteps: string[] } => {
    const steps = [
      { name: 'Project Details', completed: !!project?.name },
      { name: 'Brand Colors', completed: !!project?.brand?.palette?.length },
      { name: 'Typography', completed: !!project?.brand?.headingFont?.family },
      { name: 'Content', completed: !!project?.content?.headline },
      { name: 'Layout', completed: !!project?.layout?.sections?.length },
    ];
    
    const completed = steps.filter(step => step.completed);
    const missing = steps.filter(step => !step.completed);
    
    return {
      percentage: Math.round((completed.length / steps.length) * 100),
      completedSteps: completed.map(s => s.name),
      missingSteps: missing.map(s => s.name),
    };
  };

  if (!project) {
    return <div>Loading...</div>;
  }

  const validation = validateProjectData();
  const completeness = getProjectCompleteness();

  return (
    <div className="space-y-6">
      {/* Generation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Theme Generation
          </CardTitle>
          <CardDescription>
            Generate your WordPress block theme based on your project configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Project Completeness */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Project Completeness</span>
              <span className="text-sm text-muted-foreground">{completeness.percentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${completeness.percentage}%` }}
              />
            </div>
            
            {completeness.missingSteps.length > 0 && (
              <div className="text-sm text-muted-foreground">
                <p>Recommended to complete: {completeness.missingSteps.join(', ')}</p>
              </div>
            )}
          </div>

          {/* Validation Issues */}
          {!validation.isValid && (
            <div className="border border-destructive/20 bg-destructive/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="font-medium text-destructive">Issues Found</span>
              </div>
              <ul className="text-sm text-destructive space-y-1">
                {validation.issues.map((issue, index) => (
                  <li key={index}>• {issue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Generation Controls */}
          <div className="flex gap-4">
            <Button 
              onClick={() => handleGenerate(false)}
              disabled={isGenerating || !validation.isValid}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Theme...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  {lastGenerated ? 'Regenerate Theme' : 'Generate Theme'}
                </>
              )}
            </Button>
            
            {lastGenerated && (
              <Button 
                onClick={() => handleGenerate(true)}
                disabled={isGenerating}
                variant="outline"
              >
                Force New Generation
              </Button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="border border-destructive/20 bg-destructive/10 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="font-medium text-destructive">Generation Failed</span>
              </div>
              <p className="text-sm text-destructive mt-1">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last Generation Info */}
      {lastGenerated && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Last Generation
            </CardTitle>
            <CardDescription>
              Theme generated on {new Date(lastGenerated.createdAt).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {Array.isArray(lastGenerated.patterns) ? lastGenerated.patterns.length : 0}
                </div>
                <div className="text-sm text-muted-foreground">Patterns</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {lastGenerated.themeJson && typeof lastGenerated.themeJson === 'object' && 
                   lastGenerated.themeJson.settings?.color?.palette ? 
                   lastGenerated.themeJson.settings.color.palette.length : 0}
                </div>
                <div className="text-sm text-muted-foreground">Colors</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {generationTime ? formatGenerationTime(generationTime) : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Generation Time</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {lastGenerated.meta && typeof lastGenerated.meta === 'object' && 
                   'aiUsed' in lastGenerated.meta ? 
                   (lastGenerated.meta.aiUsed ? 'AI' : 'Rule') : 'Rule'}
                </div>
                <div className="text-sm text-muted-foreground">Generation Type</div>
              </div>
            </div>
            
            {/* Generation Details */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Generation Details</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                {lastGenerated.meta && typeof lastGenerated.meta === 'object' && (
                  <>
                    {'lockedColors' in lastGenerated.meta && (
                      <p>• {lastGenerated.meta.lockedColors} locked colors preserved</p>
                    )}
                    {'provenance' in lastGenerated.meta && (
                      <p>• Generated using {lastGenerated.meta.provenance}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Project Summary</CardTitle>
          <CardDescription>
            Overview of your project configuration for theme generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Palette className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Brand Colors</div>
                  <div className="text-sm text-muted-foreground">
                    {project.brand?.palette?.length || 0} colors configured
                    {project.brand?.palette?.some(p => p.locked) && 
                     ` (${project.brand.palette.filter(p => p.locked).length} locked)`}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Type className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Typography</div>
                  <div className="text-sm text-muted-foreground">
                    {project.brand?.headingFont?.family || 'Default'} / 
                    {project.brand?.bodyFont?.family || 'Default'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Content</div>
                  <div className="text-sm text-muted-foreground">
                    {project.content?.headline ? 'Headline set' : 'No headline'}
                    {project.content?.benefits?.length ? 
                     `, ${project.content.benefits.length} benefits` : ''}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Image className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Assets</div>
                  <div className="text-sm text-muted-foreground">
                    {project.brand?.logoPath ? 'Logo uploaded' : 'No logo'}
                    {project.assets?.heroPath ? ', Hero image' : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}