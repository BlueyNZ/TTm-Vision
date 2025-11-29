'use client';

import React, { useRef, useState } from 'react';
import { Upload, File as FileIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploadInputProps {
  id: string;
  label: string;
  onFileSelected: (file: File | null) => void;
  selectedFile?: File | null;
  accept?: string;
  className?: string;
  disabled?: boolean;
}

export function FileUploadInput({
  id,
  label,
  onFileSelected,
  selectedFile,
  accept = '.pdf,.doc,.docx',
  className,
  disabled = false,
}: FileUploadInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!disabled && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onFileSelected(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileSelected(file);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelected(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.includes('pdf')) return '📄';
    if (file.type.includes('word')) return '📝';
    if (file.type.includes('sheet')) return '📊';
    return '📎';
  };

  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          'hover:bg-muted/50',
          isDragOver && 'border-primary bg-primary/5',
          disabled && 'opacity-50 cursor-not-allowed',
          selectedFile ? 'bg-muted/30 border-primary/50' : 'border-muted-foreground/25'
        )}
      >
        <input
          ref={fileInputRef}
          id={id}
          type="file"
          onChange={handleFileChange}
          accept={accept}
          className="hidden"
          disabled={disabled}
        />

        {selectedFile ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 text-left">
              <span className="text-2xl">{getFileIcon(selectedFile)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClear}
              disabled={disabled}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {isDragOver ? 'Drop your file here' : 'Drag and drop your file here'}
              </p>
              <p className="text-xs text-muted-foreground">or click to select</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Supported formats: PDF, DOC, DOCX
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
