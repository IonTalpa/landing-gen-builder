'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Monitor, Smartphone, Tablet, Loader2, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import type { Project } from '@/types';

interface PreviewTabProps {
  project?: Project;
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile';
type PreviewType = 'html' | 'wordpress';

const viewportSizes = {
  desktop: { width: '100%', height: '600px', icon: Monitor },
  tablet: { width: '768px', height: '600px', icon: Tablet },
  mobile: { width: '375px', height: '600px', icon: Smartphone },
};

export default function PreviewTab({ project }: PreviewTabProps) {
  const [activeViewport, setActiveViewport] = useState<ViewportSize>('desktop');
  const [previewType, setPreviewType] = useState<PreviewType>('html');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const wpIframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (project?.generated && project.generated.length > 0) {
      setLastGenerated(new Date(project.generated[0].createdAt));
      // Auto-load HTML preview
      loadPreview('html');
    }
  }, [project]);

  const loadPreview = async (type: PreviewType) => {
    if (!project) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/preview/${project.id}?type=${type}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Preview generation failed');
      }
      
      setPreviewData({ ...data.data, type });
      
      if (type === 'html') {
        updateHTMLPreview(data.data);
      } else if (type === 'wordpress') {
        setupWordPressPreview(data.data);
      }
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Preview failed');
    } finally {
      setIsLoading(false);
    }
  };

  const updateHTMLPreview = (data: any) => {
    if (!iframeRef.current) return;
    
    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    
    if (doc) {
      doc.open();
      doc.write(data.html);
      doc.close();
      
      // Inject CSS
      const style = doc.createElement('style');
      style.textContent = data.css;
      doc.head.appendChild(style);
    }
  };

  const setupWordPressPreview = async (data: any) => {
    if (!wpIframeRef.current) return;
    
    const playgroundUrl = `${data.playgroundUrl}${data.playgroundUrl.includes('?') ? '&' : '?'}mode=seamless`;
    wpIframeRef.current.src = playgroundUrl;
    
    // Wait for WordPress Playground to load, then send theme data
    wpIframeRef.current.onload = () => {
      setTimeout(() => {
        if (wpIframeRef.current?.contentWindow) {
          // Send theme installation message
          wpIframeRef.current.contentWindow.postMessage({
            type: 'INSTALL_THEME_FROM_ZIP',
            payload: {
              zipArrayBuffer: Uint8Array.from(atob(data.themeZip), c => c.charCodeAt(0)).buffer,
              activate: true,
            },
          }, '*');
          
          // Create and set front page
          setTimeout(() => {
            wpIframeRef.current?.contentWindow?.postMessage({
              type: 'RUN_PHP',
              payload: `
                // Create front page
                $page_id = wp_insert_post(array(
                  'post_title' => '${project?.name || 'Home'}',
                  'post_content' => '',
                  'post_status' => 'publish',
                  'post_type' => 'page'
                ));
                
                // Set as front page
                update_option('show_on_front', 'page');
                update_option('page_on_front', $page_id);
                
                // Redirect to front page
                wp_redirect(home_url());
              `,
            }, '*');
          }, 2000);
        }
      }, 1000);
    };
  };

  const handleRefresh = () => {
    loadPreview(previewType);
  };

  const openInNewTab = () => {
    if (previewType === 'html' && previewData?.html) {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(previewData.html);
        newWindow.document.close();
        
        // Inject CSS
        const style = newWindow.document.createElement('style');
        style.textContent = previewData.css;
        newWindow.document.head.appendChild(style);
      }
    } else if (previewType === 'wordpress' && previewData?.playgroundUrl) {
      window.open(previewData.playgroundUrl, '_blank');
    }
  };

  const hasGeneration = project?.generated && project.generated.length > 0;

  if (!project) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Preview Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Theme Preview</CardTitle>
              <CardDescription>
                Preview your WordPress theme in HTML and WordPress Playground
                {lastGenerated && (
                  <span className="block mt-1 text-xs">
                    Last generated: {lastGenerated.toLocaleString()}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefresh}
                disabled={isLoading || !hasGeneration}
                variant="outline"
                size="sm"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={openInNewTab}
                disabled={!previewData}
                variant="outline"
                size="sm"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {!hasGeneration && (
          <CardContent>
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Theme Generated</h3>
              <p className="text-muted-foreground mb-4">
                You need to generate a theme first before you can preview it.
              </p>
              <Button onClick={() => window.location.href = `/project/${project.id}/generate`}>
                Go to Generate Tab
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {hasGeneration && (
        <Card>
          <CardContent className="p-0">
            <Tabs value={previewType} onValueChange={(value) => {
              setPreviewType(value as PreviewType);
              loadPreview(value as PreviewType);
            }}>
              <div className="flex items-center justify-between p-6 border-b">
                <TabsList>
                  <TabsTrigger value="html">HTML Preview</TabsTrigger>
                  <TabsTrigger value="wordpress">WordPress Playground</TabsTrigger>
                </TabsList>
                
                {/* Viewport Controls */}
                <div className="flex items-center gap-2">
                  {Object.entries(viewportSizes).map(([size, config]) => {
                    const Icon = config.icon;
                    return (
                      <Button
                        key={size}
                        onClick={() => setActiveViewport(size as ViewportSize)}
                        variant={activeViewport === size ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Icon className="h-4 w-4" />
                      </Button>
                    );
                  })}
                </div>
              </div>
              
              {error && (
                <div className="p-6 border-b bg-destructive/5">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Preview Error</span>
                  </div>
                  <p className="text-sm text-destructive mt-1">{error}</p>
                </div>
              )}
              
              <TabsContent value="html" className="m-0">
                <div className="relative bg-gray-100 dark:bg-gray-900 min-h-[600px] flex items-center justify-center">
                  {isLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>Loading HTML preview...</span>
                    </div>
                  ) : (
                    <div className="relative bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300"
                         style={{ 
                           width: viewportSizes[activeViewport].width,
                           height: viewportSizes[activeViewport].height,
                           maxWidth: '100%'
                         }}>
                      <iframe
                        ref={iframeRef}
                        className="w-full h-full border-0"
                        title="HTML Preview"
                        sandbox="allow-same-origin allow-scripts allow-forms"
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="wordpress" className="m-0">
                <div className="relative bg-gray-100 dark:bg-gray-900 min-h-[600px] flex items-center justify-center">
                  {isLoading ? (
                    <div className="flex flex-col items-center gap-4 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <div className="text-center">
                        <p className="font-medium">Setting up WordPress Playground...</p>
                        <p className="text-sm">This may take a moment</p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300"
                         style={{ 
                           width: viewportSizes[activeViewport].width,
                           height: viewportSizes[activeViewport].height,
                           maxWidth: '100%'
                         }}>
                      <iframe
                        ref={wpIframeRef}
                        className="w-full h-full border-0"
                        title="WordPress Playground Preview"
                        sandbox="allow-same-origin allow-scripts allow-forms allow-downloads allow-modals"
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
      
      {/* Preview Info */}
      {previewData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Preview Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium">Type</div>
                <div className="text-muted-foreground capitalize">{previewData.type}</div>
              </div>
              <div>
                <div className="font-medium">Viewport</div>
                <div className="text-muted-foreground capitalize">{activeViewport}</div>
              </div>
              <div>
                <div className="font-medium">Generated</div>
                <div className="text-muted-foreground">
                  {new Date(previewData.generatedAt).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="font-medium">Status</div>
                <div className="text-green-600">Ready</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}