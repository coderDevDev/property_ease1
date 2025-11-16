'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Upload, X, Image as ImageIcon, AlertCircle, Camera } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  // New props (preferred)
  label?: string;
  description?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  existingImages?: string[];
  onChange?: (images: string[]) => void;
  imageType?: string;
  propertyId?: string;
  
  // Legacy props (for backward compatibility)
  images?: string[];
  onImagesChange?: (images: string[]) => void;
  maxImages?: number;
  className?: string;
  disabled?: boolean;
}

export function ImageUpload(props: ImageUploadProps) {
  // Support both old and new prop patterns
  const {
    // New props
    label,
    description,
    multiple = true,
    maxFiles,
    maxFileSize = 5,
    existingImages,
    onChange,
    imageType,
    propertyId,
    
    // Legacy props
    images: legacyImages,
    onImagesChange: legacyOnImagesChange,
    maxImages: legacyMaxImages,
    className,
    disabled = false
  } = props;
  
  // Use new props if available, otherwise fall back to legacy props
  const images = existingImages ?? legacyImages ?? [];
  const onImagesChange = onChange ?? legacyOnImagesChange;
  const maxImages = maxFiles ?? legacyMaxImages ?? 5;
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    // Check if onImagesChange is a function
    if (typeof onImagesChange !== 'function') {
      console.error('onImagesChange is not a function');
      toast.error('Image upload handler not configured properly');
      return;
    }

    const newFiles = Array.from(files);
    const totalImages = (images || []).length + newFiles.length;

    if (totalImages > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    setIsUploading(true);

    try {
      const uploadPromises = newFiles.map(async file => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image file`);
        }

        // Validate file size (use maxFileSize from props)
        const maxSizeBytes = maxFileSize * 1024 * 1024;
        if (file.size > maxSizeBytes) {
          throw new Error(`${file.name} is too large. Maximum size is ${maxFileSize}MB`);
        }

        // Convert to base64 for now (in production, upload to cloud storage)
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () =>
            reject(new Error(`Failed to read ${file.name}`));
          reader.readAsDataURL(file);
        });
      });

      const uploadedImages = await Promise.all(uploadPromises);
      onImagesChange([...(images || []), ...uploadedImages]);
      toast.success(`${uploadedImages.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to upload images'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    if (typeof onImagesChange !== 'function') {
      console.error('onImagesChange is not a function');
      return;
    }
    const newImages = (images || []).filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Optional Label and Description */}
      {(label || description) && (
        <div className="space-y-1">
          {label && <h3 className="text-sm font-medium text-gray-900">{label}</h3>}
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
      )}
      
      {/* Upload Area */}
      <Card className="border-2 border-dashed border-blue-200 hover:border-blue-300 transition-colors">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              {isUploading ? (
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
              ) : (
                <Upload className="w-6 h-6 text-blue-500" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">
                {isUploading ? 'Uploading...' : 'Upload images'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, GIF up to {maxFileSize}MB each (max {maxImages} images)
              </p>
            </div>
            
            {/* Upload Options */}
            <div className="flex gap-3 w-full max-w-xs">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => cameraInputRef.current?.click()}
                disabled={disabled || isUploading || (images || []).length >= maxImages}
                className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50">
                <Camera className="w-4 h-4 mr-2" />
                Take Photo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading || (images || []).length >= maxImages}
                className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50">
                <ImageIcon className="w-4 h-4 mr-2" />
                Choose Files
              </Button>
            </div>
          </div>
          
          {/* Camera Input - Opens camera directly */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={e => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={disabled}
          />
          
          {/* File Input - Opens gallery/file picker */}
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept="image/*"
            onChange={e => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={disabled}
          />
        </CardContent>
      </Card>

      {/* Image Preview Grid */}
      {(images || []).length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              Attached Images ({(images || []).length}/{maxImages})
            </p>
            {(images || []).length >= maxImages && (
              <div className="flex items-center gap-1 text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs">Maximum reached</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {(images || []).map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image}
                  alt={`Attachment ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border border-gray-200"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-xs"
                      onClick={() => window.open(image, '_blank')}>
                      View
                    </Button>
                    {!disabled && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="text-xs"
                        onClick={() => removeImage(index)}>
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
