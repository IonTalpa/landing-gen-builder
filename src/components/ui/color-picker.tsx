'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Lock, Unlock, Palette } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { clsx } from 'clsx';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  locked?: boolean;
  onLockToggle?: () => void;
  label: string;
  source?: 'user' | 'logo_ai' | 'manual';
  className?: string;
}

export function ColorPicker({
  value,
  onChange,
  locked = false,
  onLockToggle,
  label,
  source = 'user',
  className,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const colorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleColorChange = (newColor: string) => {
    setTempValue(newColor);
    onChange(newColor);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setTempValue(newValue);
    
    // Validate hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
      onChange(newValue);
    }
  };

  const handleInputBlur = () => {
    // If invalid hex, revert to current value
    if (!/^#[0-9A-Fa-f]{6}$/.test(tempValue)) {
      setTempValue(value);
    }
  };

  const openNativePicker = () => {
    if (colorInputRef.current) {
      colorInputRef.current.click();
    }
  };

  const getSourceLabel = () => {
    switch (source) {
      case 'logo_ai':
        return 'From logo';
      case 'manual':
        return 'Manual';
      default:
        return 'User set';
    }
  };

  return (
    <div className={clsx('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">
            {getSourceLabel()}
          </span>
          {onLockToggle && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onLockToggle}
              className="h-6 w-6 p-0"
              title={locked ? 'Unlock color' : 'Lock color'}
            >
              {locked ? (
                <Lock className="h-3 w-3" />
              ) : (
                <Unlock className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div
          className={clsx(
            'relative h-10 w-16 rounded-md border border-input cursor-pointer overflow-hidden',
            locked && 'opacity-50 cursor-not-allowed'
          )}
          onClick={!locked ? openNativePicker : undefined}
        >
          <div
            className="h-full w-full"
            style={{ backgroundColor: value }}
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/20 transition-opacity">
            <Palette className="h-4 w-4 text-white" />
          </div>
        </div>
        
        <Input
          type="text"
          value={tempValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder="#000000"
          className="flex-1 font-mono text-sm"
          disabled={locked}
          maxLength={7}
        />
        
        <input
          ref={colorInputRef}
          type="color"
          value={value}
          onChange={(e) => handleColorChange(e.target.value)}
          className="sr-only"
          disabled={locked}
        />
      </div>
      
      {locked && (
        <p className="text-xs text-muted-foreground">
          This color is locked and won't be modified during generation.
        </p>
      )}
    </div>
  );
}