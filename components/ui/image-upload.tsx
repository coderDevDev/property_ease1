'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  X,
  Image as ImageIcon,
  FileImage,
  Eye,
  Trash2,
  Camera,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { PropertiesAPI } from '@/lib/api/properties';

interface ImageUploadProps {
  label: string;
  description?: string;
  multiple?: boolean;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in MB
  maxFiles?: number;
  existingImages?: string[];
  onChange: (images: string[]) => void;
  className?: string;
  imageType: 'property' | 'thumbnail' | 'floor_plan';
  propertyId?: string; // Required for Supabase upload path
}

export function ImageUpload({
  label,
  description,
  multiple = false,
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp'],
  maxFileSize = 10, // 10MB default
  maxFiles = 10,
  existingImages = [],
  onChange,
  className = '',
  imageType,
  propertyId
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>(existingImages);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!acceptedFileTypes.includes(file.type)) {
      toast.error(
        `Invalid file type. Accepted types: ${acceptedFileTypes.join(', ')}`
      );
      return false;
    }

    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      toast.error(`File too large. Maximum size: ${maxFileSize}MB`);
      return false;
    }

    return true;
  };

  const handleFiles = async (files: FileList) => {
    const validFiles: File[] = [];

    // Validate each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (validateFile(file)) {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) return;

    // Check max files limit
    if (!multiple && validFiles.length > 1) {
      toast.error('Only one file allowed');
      return;
    }

    if (previewImages.length + validFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} images allowed`);
      return;
    }

    try {
      setIsUploading(true);

      if (propertyId) {
        // Upload to Supabase Storage
        const uploadedUrls: string[] = [];

        for (const file of validFiles) {
          const result = await PropertiesAPI.uploadPropertyImage(
            propertyId,
            file,
            imageType
          );

          if (result.success && result.url) {
            uploadedUrls.push(result.url);
          } else {
            toast.error(result.message || `Failed to upload ${file.name}`);
            continue;
          }
        }

        if (uploadedUrls.length > 0) {
          const newImages = [...previewImages, ...uploadedUrls];
          setPreviewImages(newImages);
          onChange(newImages);
          toast.success(
            `${uploadedUrls.length} image(s) uploaded successfully`
          );
        }
      } else {
        // Create preview URLs for local display (for new properties without ID yet)
        const newPreviewUrls = validFiles.map(file =>
          URL.createObjectURL(file)
        );
        const newImages = [...previewImages, ...newPreviewUrls];
        setPreviewImages(newImages);
        onChange(newImages);

        // Store files temporarily for upload after property creation
        toast.success('Images ready for upload');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload images');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeImage = (index: number) => {
    const newImages = previewImages.filter((_, i) => i !== index);
    setPreviewImages(newImages);
    onChange(newImages);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getImageTypeIcon = () => {
    switch (imageType) {
      case 'thumbnail':
        return <ImageIcon className="w-5 h-5" />;
      case 'floor_plan':
        return <MapPin className="w-5 h-5" />;
      default:
        return <Camera className="w-5 h-5" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          {getImageTypeIcon()}
          {label}
        </Label>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-blue-200 hover:border-blue-400 hover:bg-blue-50/50'
        }`}
        onClick={openFileDialog}>
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedFileTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="space-y-3">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Upload className="w-6 h-6 text-blue-600" />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-900">
              {isUploading
                ? 'Uploading...'
                : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-gray-500">
              {acceptedFileTypes.join(', ').toUpperCase()} up to {maxFileSize}MB
              {multiple && ` (max ${maxFiles} files)`}
            </p>
          </div>

          {isUploading && (
            <div className="mx-auto w-6 h-6">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
      </div>

      {/* Image Previews */}
      {previewImages.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">
            Uploaded Images ({previewImages.length})
          </Label>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {previewImages.map((image, index) => (
              <div
                key={index}
                className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-square">
                <img
                  src={image}
                  alt={`${imageType} ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                />

                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={e => {
                      e.stopPropagation();
                      window.open(image, '_blank');
                    }}
                    className="h-8 w-8 p-0">
                    <Eye className="w-4 h-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={e => {
                      e.stopPropagation();
                      removeImage(index);
                    }}
                    className="h-8 w-8 p-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Image type badge */}
                {imageType === 'thumbnail' && index === 0 && (
                  <Badge className="absolute top-2 left-2 bg-blue-600 text-white text-xs">
                    Thumbnail
                  </Badge>
                )}

                {imageType === 'floor_plan' && (
                  <Badge className="absolute top-2 left-2 bg-green-600 text-white text-xs">
                    Floor Plan
                  </Badge>
                )}
              </div>
            ))}
          </div>

          {multiple && previewImages.length < maxFiles && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openFileDialog}
              disabled={isUploading}
              className="border-blue-200 text-blue-600 hover:bg-blue-50">
              <Upload className="w-4 h-4 mr-2" />
              Add More Images
            </Button>
          )}
        </div>
      )}

      {/* Upload Guidelines */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Supported formats: JPEG, PNG, WebP</p>
        <p>• Maximum file size: {maxFileSize}MB per image</p>
        {multiple && <p>• Maximum {maxFiles} images total</p>}
        <p>• Recommended dimensions: 1920x1080 for best quality</p>
      </div>
    </div>
  );
}
