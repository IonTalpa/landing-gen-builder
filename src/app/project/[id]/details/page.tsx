'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import type { Project } from '@/types';

interface DetailsTabProps {
  project?: Project;
  updateProject?: (updates: Partial<Project>) => Promise<Project>;
  setHasUnsavedChanges?: (has: boolean) => void;
}

export default function DetailsTab({ 
  project, 
  updateProject, 
  setHasUnsavedChanges 
}: DetailsTabProps) {
  const [formData, setFormData] = useState({
    name: '',
    sector: '',
    locale: 'tr',
    styleTags: [] as string[],
  });
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        sector: project.sector || '',
        locale: project.locale || 'tr',
        styleTags: Array.isArray(project.styleTags) ? project.styleTags : [],
      });
    }
  }, [project]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setHasUnsavedChanges?.(true);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.styleTags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        styleTags: [...prev.styleTags, newTag.trim()],
      }));
      setNewTag('');
      setHasUnsavedChanges?.(true);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      styleTags: prev.styleTags.filter(tag => tag !== tagToRemove),
    }));
    setHasUnsavedChanges?.(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async () => {
    if (!updateProject) return;
    
    try {
      await updateProject(formData);
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  if (!project) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
          <CardDescription>
            Basic information about your WordPress landing page project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="My Landing Page"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sector">Sector</Label>
              <Input
                id="sector"
                name="sector"
                value={formData.sector}
                onChange={handleInputChange}
                placeholder="Technology, Healthcare, etc."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="locale">Language</Label>
            <select
              id="locale"
              name="locale"
              value={formData.locale}
              onChange={handleInputChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="tr">Turkish</option>
              <option value="en">English</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Style Tags</CardTitle>
          <CardDescription>
            Add descriptive tags that will help guide the theme generation process
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a style tag (e.g., modern, minimal, corporate)"
              className="flex-1"
            />
            <Button 
              type="button" 
              onClick={handleAddTag}
              disabled={!newTag.trim() || formData.styleTags.includes(newTag.trim())}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {formData.styleTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.styleTags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-primary/10 text-primary border border-primary/20"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-primary/70 hover:text-primary"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          
          {formData.styleTags.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No style tags added yet. Add some tags to help guide the theme generation.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}