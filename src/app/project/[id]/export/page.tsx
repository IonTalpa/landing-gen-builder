'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Download, 
  Package, 
  CheckCircle, 
  Clock, 
  FileArchive, 
  Loader2, 
  AlertCircle,
  ExternalLink,
  Copy,
  Shield
} from 'lucide-react';
import type { Project, Export } from '@/types';

interface ExportTabProps {
  project?: Project;
}

interface ExportOptions {
  includeAssets: boolean;
  stripExif: boolean;
  validateContent: boolean;
}

export default function ExportTab({ project }: ExportTabProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<Export[]>([]);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeAssets: true,
    stripExif: true,
    validateContent: true,
  });
  const [lastExport, setLastExport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    if (project) {
      fetchExportHistory();
    }
  }, [project]);

  const fetchExportHistory = async () => {
    if (!project) return;
    
    try {
      const response = await fetch(`/api/export?projectId=${project.id}`);
      const data = await response.json();
      
      if (data.success) {
        setExportHistory(data.data.exports);
      }
    } catch (error) {
      console.error('Failed to fetch export history:', error);
    }
  };

  const handleExport = async () => {
    if (!project) return;
    
    setIsExporting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          ...exportOptions,
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Export failed');
      }
      
      setLastExport(data.data);
      await fetchExportHistory();
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = (downloadUrl: string) => {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const formatFileSize = (sizeKB: number): string => {
    if (sizeKB < 1024) {
      return `${sizeKB} KB`;
    }
    return `${(sizeKB / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const hasGeneration = project?.generated && project.generated.length > 0;

  if (!project) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Export WordPress Theme
          </CardTitle>
          <CardDescription>
            Download your completed WordPress block theme as a production-ready ZIP file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!hasGeneration ? (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Theme Generated</h3>
              <p className="text-muted-foreground mb-4">
                You need to generate a theme first before you can export it.
              </p>
              <Button onClick={() => window.location.href = `/project/${project.id}/generate`}>
                Go to Generate Tab
              </Button>
            </div>
          ) : (
            <>
              {/* Export Options */}
              <div className="space-y-4">
                <h4 className="font-medium">Export Options</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeAssets"
                      checked={exportOptions.includeAssets}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, includeAssets: checked as boolean }))
                      }
                    />
                    <label htmlFor="includeAssets" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Include uploaded assets (logo, images)
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="stripExif"
                      checked={exportOptions.stripExif}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, stripExif: checked as boolean }))
                      }
                    />
                    <label htmlFor="stripExif" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Strip EXIF data from images
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="validateContent"
                      checked={exportOptions.validateContent}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, validateContent: checked as boolean }))
                      }
                    />
                    <label htmlFor="validateContent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      <span className="flex items-center gap-2">
                        <Shield className="h-3 w-3" />
                        Validate content (scan for AI references)
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Export Button */}
              <Button 
                onClick={handleExport}
                disabled={isExporting}
                className="w-full"
                size="lg"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Exporting WordPress Theme...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Export WordPress Theme ZIP
                  </>
                )}
              </Button>

              {/* Error Display */}
              {error && (
                <div className="border border-destructive/20 bg-destructive/10 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="font-medium text-destructive">Export Failed</span>
                  </div>
                  <p className="text-sm text-destructive mt-1">{error}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Last Export Info */}
      {lastExport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Export Completed
            </CardTitle>
            <CardDescription>
              Your WordPress theme has been successfully exported
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {formatFileSize(lastExport.sizeKB)}
                </div>
                <div className="text-sm text-muted-foreground">File Size</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {lastExport.exportTime ? `${lastExport.exportTime}ms` : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Export Time</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {lastExport.themeInfo?.version || '1.0.0'}
                </div>
                <div className="text-sm text-muted-foreground">Version</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  <CheckCircle className="h-8 w-8 mx-auto" />
                </div>
                <div className="text-sm text-muted-foreground">Ready</div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => handleDownload(lastExport.downloadUrl)}
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Download ZIP
              </Button>
              
              <Button 
                onClick={() => copyToClipboard(window.location.origin + lastExport.downloadUrl)}
                variant="outline"
              >
                {copiedUrl ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {/* Theme Info */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Theme Information</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Name:</strong> {lastExport.themeInfo?.name}</p>
                <p><strong>Slug:</strong> {lastExport.themeInfo?.slug}</p>
                <p><strong>Author:</strong> {lastExport.themeInfo?.author}</p>
                <p><strong>Checksum:</strong> <code className="text-xs">{lastExport.checksum.substring(0, 16)}...</code></p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export History */}
      {exportHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Export History
            </CardTitle>
            <CardDescription>
              Previous exports of this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exportHistory.map((exportItem) => (
                <div 
                  key={exportItem.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileArchive className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">
                        WordPress Theme Export
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(exportItem.createdAt)} • {formatFileSize(exportItem.sizeKB)}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleDownload(`/api/download/${project.slug}/${exportItem.zipPath.split('/').pop()}`)}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* WordPress Installation Guide */}
      <Card>
        <CardHeader>
          <CardTitle>WordPress Installation Guide</CardTitle>
          <CardDescription>
            How to install your exported theme in WordPress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Method 1: WordPress Admin Dashboard</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Log in to your WordPress admin dashboard</li>
                <li>Go to Appearance → Themes</li>
                <li>Click "Add New" → "Upload Theme"</li>
                <li>Choose your downloaded ZIP file and click "Install Now"</li>
                <li>Activate the theme once installation is complete</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Method 2: FTP Upload</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Extract the ZIP file on your computer</li>
                <li>Upload the theme folder to <code>/wp-content/themes/</code></li>
                <li>Go to Appearance → Themes in WordPress admin</li>
                <li>Find and activate your theme</li>
              </ol>
            </div>
            
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> This theme requires WordPress 6.5+ and uses the block editor (Gutenberg). 
                Make sure your WordPress installation supports Full Site Editing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}