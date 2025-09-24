'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  className?: string;
  disabled?: boolean;
}

export function ImageUpload({
  images,
  onImagesChange,
  maxImages = 5,
  className,
  disabled = false
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

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

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} is too large. Maximum size is 5MB`);
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
      onImagesChange([...images, ...uploadedImages]);
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
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <Card className="border-2 border-dashed border-blue-200 hover:border-blue-300 transition-colors">
        <CardContent className="p-6">
          <div
            className={cn(
              'flex flex-col items-center justify-center space-y-4 cursor-pointer',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            onClick={openFileDialog}>
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              {isUploading ? (
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
              ) : (
                <Upload className="w-6 h-6 text-blue-500" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">
                {isUploading ? 'Uploading...' : 'Click to upload images'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, GIF up to 5MB each (max {maxImages} images)
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || isUploading}
              className="border-blue-200 text-blue-600 hover:bg-blue-50">
              <ImageIcon className="w-4 h-4 mr-2" />
              Choose Files
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
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
              Attached Images ({images.length}/{maxImages})
            </p>
            {images.length >= maxImages && (
              <div className="flex items-center gap-1 text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs">Maximum reached</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((image, index) => (
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
