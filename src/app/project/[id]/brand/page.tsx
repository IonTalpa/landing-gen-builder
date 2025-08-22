'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ColorPicker } from '@/components/ui/color-picker';
import { FileUpload } from '@/components/ui/file-upload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Palette, Wand2 } from 'lucide-react';
import type { Project, ColorToken, FontConfig } from '@/types';

interface BrandTabProps {
  project?: Project;
  updateProject?: (updates: Partial<Project>) => Promise<Project>;
  setHasUnsavedChanges?: (has: boolean) => void;
}

const defaultColors: ColorToken[] = [
  { slug: 'primary', color: '#3b82f6', locked: false, source: 'user' },
  { slug: 'secondary', color: '#10b981', locked: false, source: 'user' },
  { slug: 'accent', color: '#f59e0b', locked: false, source: 'user' },
  { slug: 'neutral', color: '#6b7280', locked: false, source: 'user' },
  { slug: 'background', color: '#ffffff', locked: false, source: 'user' },
  { slug: 'text', color: '#1f2937', locked: false, source: 'user' },
];

const fontOptions = [
  { name: 'Inter', family: 'Inter, system-ui, sans-serif' },
  { name: 'Roboto', family: 'Roboto, system-ui, sans-serif' },
  { name: 'Open Sans', family: '"Open Sans", system-ui, sans-serif' },
  { name: 'Lato', family: 'Lato, system-ui, sans-serif' },
  { name: 'Montserrat', family: 'Montserrat, system-ui, sans-serif' },
  { name: 'Poppins', family: 'Poppins, system-ui, sans-serif' },
  { name: 'System UI', family: 'system-ui, -apple-system, sans-serif' },
  { name: 'Georgia', family: 'Georgia, serif' },
  { name: 'Times New Roman', family: '"Times New Roman", serif' },
];

export default function BrandTab({ 
  project, 
  updateProject, 
  setHasUnsavedChanges 
}: BrandTabProps) {
  const [brandData, setBrandData] = useState({
    primary: '',
    secondary: '',
    palette: defaultColors,
    headingFont: {
      family: 'Inter',
      weights: [400, 600, 700],
      fallback: 'system-ui, sans-serif',
    },
    bodyFont: {
      family: 'System UI',
      weights: [400, 500],
      fallback: 'system-ui, -apple-system, sans-serif',
    },
    logoPath: '',
  });
  const [isExtracting, setIsExtracting] = useState(false);

  useEffect(() => {
    if (project?.brand) {
      setBrandData({
        primary: project.brand.primary || '',
        secondary: project.brand.secondary || '',
        palette: Array.isArray(project.brand.palette) ? project.brand.palette : defaultColors,
        headingFont: project.brand.headingFont || brandData.headingFont,
        bodyFont: project.brand.bodyFont || brandData.bodyFont,
        logoPath: project.brand.logoPath || '',
      });
    }
  }, [project]);

  const handleColorChange = (slug: string, color: string) => {
    setBrandData(prev => ({
      ...prev,
      palette: prev.palette.map(token => 
        token.slug === slug ? { ...token, color, source: 'user' as const } : token
      ),
      ...(slug === 'primary' && { primary: color }),
      ...(slug === 'secondary' && { secondary: color }),
    }));
    setHasUnsavedChanges?.(true);
  };

  const handleLockToggle = (slug: string) => {
    setBrandData(prev => ({
      ...prev,
      palette: prev.palette.map(token => 
        token.slug === slug ? { ...token, locked: !token.locked } : token
      ),
    }));
    setHasUnsavedChanges?.(true);
  };

  const handleFontChange = (type: 'heading' | 'body', family: string) => {
    const selectedFont = fontOptions.find(f => f.name === family);
    if (!selectedFont) return;

    setBrandData(prev => ({
      ...prev,
      [`${type}Font`]: {
        family: selectedFont.name,
        weights: type === 'heading' ? [400, 600, 700] : [400, 500],
        fallback: selectedFont.family,
      },
    }));
    setHasUnsavedChanges?.(true);
  };

  const handleLogoUpload = async (file: File) => {
    if (!project) throw new Error('Project not found');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectSlug', project.slug);
    formData.append('type', 'logo');

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Upload failed');
    }

    setBrandData(prev => ({
      ...prev,
      logoPath: data.data.path,
    }));
    setHasUnsavedChanges?.(true);

    return data.data.path;
  };

  const extractColorsFromLogo = async () => {
    if (!brandData.logoPath) {
      alert('Please upload a logo first');
      return;
    }

    setIsExtracting(true);
    try {
      const response = await fetch('/api/extract-colors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logoPath: brandData.logoPath,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Color extraction failed');
      }

      // Update palette with extracted colors
      setBrandData(prev => ({
        ...prev,
        palette: prev.palette.map((token, index) => {
          if (!token.locked && index < data.data.colors.length) {
            return {
              ...token,
              color: data.data.colors[index].color,
              source: 'logo_ai' as const,
            };
          }
          return token;
        }),
      }));
      setHasUnsavedChanges?.(true);
    } catch (error) {
      console.error('Color extraction failed:', error);
      alert('Failed to extract colors from logo. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSave = async () => {
    if (!updateProject) return;
    
    try {
      await updateProject({
        brand: brandData,
      });
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  if (!project) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Logo
          </CardTitle>
          <CardDescription>
            Upload your brand logo to help with color extraction and theme consistency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <FileUpload
              accept="image/svg+xml,image/png,image/jpeg"
              maxSize={5 * 1024 * 1024} // 5MB
              onUpload={handleLogoUpload}
              currentPath={brandData.logoPath ? `/uploads/${brandData.logoPath}` : undefined}
              preview={true}
              label="Logo Upload"
              description="SVG, PNG, or JPEG up to 5MB"
            />
            
            {brandData.logoPath && (
              <Button
                onClick={extractColorsFromLogo}
                disabled={isExtracting}
                variant="outline"
                className="w-full"
              >
                {isExtracting ? (
                  <>Extracting Colors...</>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Extract Colors from Logo
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Color Palette */}
      <Card>
        <CardHeader>
          <CardTitle>Color Palette</CardTitle>
          <CardDescription>
            Define your brand colors. Locked colors won't be changed during theme generation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {brandData.palette.map((token) => (
              <ColorPicker
                key={token.slug}
                value={token.color}
                onChange={(color) => handleColorChange(token.slug, color)}
                locked={token.locked}
                onLockToggle={() => handleLockToggle(token.slug)}
                label={token.slug.charAt(0).toUpperCase() + token.slug.slice(1)}
                source={token.source}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
          <CardDescription>
            Select fonts for headings and body text
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="headingFont">Heading Font</Label>
              <select
                id="headingFont"
                value={brandData.headingFont.family}
                onChange={(e) => handleFontChange('heading', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {fontOptions.map((font) => (
                  <option key={font.name} value={font.name}>
                    {font.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bodyFont">Body Font</Label>
              <select
                id="bodyFont"
                value={brandData.bodyFont.family}
                onChange={(e) => handleFontChange('body', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {fontOptions.map((font) => (
                  <option key={font.name} value={font.name}>
                    {font.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Font Preview */}
          <div className="border rounded-lg p-4 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Heading Preview</p>
              <h3 
                className="text-2xl font-bold"
                style={{ fontFamily: brandData.headingFont.fallback }}
              >
                Your Amazing Landing Page
              </h3>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Body Preview</p>
              <p 
                className="text-base"
                style={{ fontFamily: brandData.bodyFont.fallback }}
              >
                This is how your body text will look on the landing page. It should be easy to read and complement your heading font choice.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          Save Brand Settings
        </Button>
      </div>
    </div>
  );
}