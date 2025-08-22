'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, FileImage, Loader2 } from 'lucide-react';
import { Button } from './button';
import { clsx } from 'clsx';
import Image from 'next/image';

interface FileUploadProps {
  accept: string;
  maxSize: number; // in bytes
  onUpload: (file: File) => Promise<string>;
  currentPath?: string;
  preview?: boolean;
  className?: string;
  label?: string;
  description?: string;
}

export function FileUpload({
  accept,
  maxSize,
  onUpload,
  currentPath,
  preview = true,
  className,
  label = 'Upload File',
  description,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `File size must be less than ${formatFileSize(maxSize)}`;
    }

    const acceptedTypes = accept.split(',').map(type => type.trim());
    const fileType = file.type;
    const isValidType = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      return fileType.match(type.replace('*', '.*'));
    });

    if (!isValidType) {
      return `File type not supported. Accepted types: ${accept}`;
    }

    return null;
  };

  const handleFile = async (file: File) => {
    setError(null);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsUploading(true);
      await onUpload(file);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setError(null);
    // This would typically call an onRemove prop
    // For now, we'll just clear the error
  };

  const isImage = currentPath && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(currentPath);

  return (
    <div className={clsx('space-y-2', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">{label}</label>
          {currentPath && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      <div
        className={clsx(
          'relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          isUploading && 'pointer-events-none opacity-50'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          className="sr-only"
          disabled={isUploading}
        />

        {currentPath && preview && isImage ? (
          <div className="space-y-4">
            <div className="relative mx-auto w-32 h-32 rounded-lg overflow-hidden bg-muted">
              <Image
                src={currentPath}
                alt="Preview"
                fill
                className="object-cover"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Click or drop a new file to replace
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {isUploading ? (
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                {currentPath ? (
                  <FileImage className="mx-auto h-8 w-8 text-muted-foreground" />
                ) : (
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                )}
              </>
            )}
            
            <div className="space-y-2">
              <div className="text-sm font-medium">
                {isUploading
                  ? 'Uploading...'
                  : currentPath
                  ? 'Replace file'
                  : 'Drop your file here, or click to browse'}
              </div>
              {description && (
                <div className="text-xs text-muted-foreground">
                  {description}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Max size: {formatFileSize(maxSize)} • {accept}
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2">
          {error}
        </div>
      )}
    </div>
  );
}