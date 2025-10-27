'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  Megaphone,
  Save,
  Send,
  Eye,
  Calendar,
  Users,
  Target,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Plus,
  Upload,
  Home
} from 'lucide-react';
import {
  AnnouncementsAPI,
  type AnnouncementFormData,
  type Announcement
} from '@/lib/api/announcements';
import { PropertiesAPI } from '@/lib/api/properties';
import { toast } from 'sonner';

interface AnnouncementFormProps {
  announcement?: Announcement;
  propertyId?: string;
  creatorId: string;
  role: 'owner' | 'tenant';
  onSave: (announcement: Announcement) => void;
  onCancel: () => void;
  isEditing?: boolean;
  className?: string;
}

export function AnnouncementForm({
  announcement,
  propertyId,
  creatorId,
  role,
  onSave,
  onCancel,
  isEditing = false,
  className
}: AnnouncementFormProps) {
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: '',
    content: '',
    type: 'general',
    priority: 'medium',
    target_audience: 'all',
    target_users: [],
    attachments: [],
    expires_at: '',
    is_published: false,
    property_id: ''
  });

  const [availableTenants, setAvailableTenants] = useState<
    Array<{
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      avatar_url?: string;
      property_name: string;
      unit_number: string;
    }>
  >([]);

  const [properties, setProperties] = useState<
    Array<{
      id: string;
      name: string;
      address: string;
      city: string;
      type: string;
    }>
  >([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);

  // Load form data if editing
  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title,
        content: announcement.content,
        type: announcement.type,
        priority: announcement.priority,
        target_audience: announcement.target_audience,
        target_users: announcement.target_users || [],
        attachments: announcement.attachments || [],
        expires_at: announcement.expires_at || '',
        is_published: announcement.is_published,
        property_id: announcement.property_id || ''
      });
    } else if (propertyId) {
      // If creating new announcement and propertyId is provided
      setFormData(prev => ({ ...prev, property_id: propertyId }));
    }
  }, [announcement, propertyId]);

  // Load properties for owners
  useEffect(() => {
    if (role === 'owner') {
      loadProperties();
    }
  }, [role]);

  // Load available tenants for targeting
  useEffect(() => {
    if (role === 'owner' && formData.target_audience === 'specific') {
      loadAvailableTenants();
    }
  }, [role, formData.target_audience]);

  const loadProperties = async () => {
    try {
      const result = await PropertiesAPI.getProperties(creatorId);
      if (result.success) {
        setProperties(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load properties:', error);
    }
  };

  const loadAvailableTenants = async () => {
    try {
      const result = await AnnouncementsAPI.getAvailableTenants(creatorId);
      if (result.success) {
        setAvailableTenants(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load tenants:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }

    if (role === 'owner' && !formData.property_id) {
      newErrors.property_id = 'Property is required';
    }

    if (
      formData.target_audience === 'specific' &&
      formData.target_users.length === 0
    ) {
      newErrors.target_users = 'Please select at least one target user';
    }

    if (formData.expires_at && new Date(formData.expires_at) <= new Date()) {
      newErrors.expires_at = 'Expiration date must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (publish: boolean = false) => {
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    try {
      setIsLoading(true);

      const submitData = {
        ...formData,
        is_published: publish
      };

      let result;
      if (isEditing && announcement) {
        result = await AnnouncementsAPI.updateAnnouncement(
          announcement.id,
          submitData
        );
      } else {
        result = await AnnouncementsAPI.createAnnouncement(
          submitData,
          creatorId,
          formData.property_id || propertyId
        );
      }

      if (result.success && result.data) {
        toast.success(
          publish
            ? 'Announcement published successfully!'
            : isEditing
            ? 'Announcement updated successfully!'
            : 'Announcement saved as draft!'
        );
        onSave(result.data);
      } else {
        toast.error(result.message || 'Failed to save announcement');
      }
    } catch (error) {
      console.error('Save announcement error:', error);
      toast.error('Failed to save announcement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileUrls = Array.from(files).map(file => URL.createObjectURL(file));
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...fileUrls]
      }));
    }
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const toggleTargetUser = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      target_users: prev.target_users.includes(userId)
        ? prev.target_users.filter(id => id !== userId)
        : [...prev.target_users, userId]
    }));
  };

  return (
    <Card
      className={cn(
        'bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg',
        className
      )}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <Megaphone className="w-5 h-5" />
          {isEditing ? 'Edit Announcement' : 'Create New Announcement'}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-gray-700 font-medium">
            Title *
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={e => handleInputChange('title', e.target.value)}
            placeholder="Enter announcement title..."
            className={cn(
              'bg-white/50 border-blue-200/50 focus:border-blue-400',
              errors.title && 'border-red-300 focus:border-red-400'
            )}
          />
          {errors.title && (
            <p className="text-red-600 text-sm">{errors.title}</p>
          )}
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Label htmlFor="content" className="text-gray-700 font-medium">
            Content *
          </Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={e => handleInputChange('content', e.target.value)}
            placeholder="Enter announcement content..."
            rows={6}
            className={cn(
              'bg-white/50 border-blue-200/50 focus:border-blue-400',
              errors.content && 'border-red-300 focus:border-red-400'
            )}
          />
          {errors.content && (
            <p className="text-red-600 text-sm">{errors.content}</p>
          )}
        </div>

        {/* Property Selection - Only for owners */}
        {role === 'owner' && (
          <div className="space-y-2">
            <Label htmlFor="property_id" className="text-gray-700 font-medium">
              Property *
            </Label>
            <Select
              value={formData.property_id}
              onValueChange={value => handleInputChange('property_id', value)}>
              <SelectTrigger
                className={cn(
                  'bg-white/50 border-blue-200/50 focus:border-blue-400',
                  errors.property_id && 'border-red-300 focus:border-red-400'
                )}>
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map(property => (
                  <SelectItem key={property.id} value={property.id}>
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      <span>{property.name}</span>
                      <span className="text-gray-500">({property.city})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.property_id && (
              <p className="text-red-600 text-sm">{errors.property_id}</p>
            )}
          </div>
        )}

        {/* Type and Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type" className="text-gray-700 font-medium">
              Type *
            </Label>
            <Select
              value={formData.type}
              onValueChange={value => handleInputChange('type', value)}>
              <SelectTrigger className="bg-white/50 border-blue-200/50 focus:border-blue-400">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="policy">Policy</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority" className="text-gray-700 font-medium">
              Priority *
            </Label>
            <Select
              value={formData.priority}
              onValueChange={value => handleInputChange('priority', value)}>
              <SelectTrigger className="bg-white/50 border-blue-200/50 focus:border-blue-400">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Target Audience */}
        <div className="space-y-2">
          <Label
            htmlFor="target_audience"
            className="text-gray-700 font-medium">
            Target Audience *
          </Label>
          <Select
            value={formData.target_audience}
            onValueChange={value =>
              handleInputChange('target_audience', value)
            }>
            <SelectTrigger className="bg-white/50 border-blue-200/50 focus:border-blue-400">
              <SelectValue placeholder="Select target audience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="tenants">Tenants Only</SelectItem>
              <SelectItem value="owners">Owners Only</SelectItem>
              <SelectItem value="specific">Specific Users</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Specific Target Users */}
        {formData.target_audience === 'specific' && (
          <div className="space-y-2">
            <Label className="text-gray-700 font-medium">
              Select Target Users *
            </Label>
            <div className="max-h-40 overflow-y-auto border border-blue-200/50 rounded-lg p-3 bg-white/50">
              {availableTenants.length === 0 ? (
                <p className="text-gray-500 text-sm">No tenants available</p>
              ) : (
                <div className="space-y-2">
                  {availableTenants.map(tenant => (
                    <div
                      key={tenant.id}
                      className="flex items-center space-x-2">
                      <Checkbox
                        id={tenant.id}
                        checked={formData.target_users.includes(tenant.id)}
                        onCheckedChange={() => toggleTargetUser(tenant.id)}
                      />
                      <Label htmlFor={tenant.id} className="text-sm">
                        {tenant.first_name} {tenant.last_name} -{' '}
                        {tenant.property_name} ({tenant.unit_number})
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {errors.target_users && (
              <p className="text-red-600 text-sm">{errors.target_users}</p>
            )}
          </div>
        )}

        {/* Expiration Date */}
        <div className="space-y-2">
          <Label htmlFor="expires_at" className="text-gray-700 font-medium">
            Expiration Date (Optional)
          </Label>
          <Input
            id="expires_at"
            type="datetime-local"
            value={formData.expires_at}
            onChange={e => handleInputChange('expires_at', e.target.value)}
            className={cn(
              'bg-white/50 border-blue-200/50 focus:border-blue-400',
              errors.expires_at && 'border-red-300 focus:border-red-400'
            )}
          />
          {errors.expires_at && (
            <p className="text-red-600 text-sm">{errors.expires_at}</p>
          )}
        </div>

        {/* Attachments */}
        <div className="space-y-2">
          <Label className="text-gray-700 font-medium">Attachments</Label>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="bg-white/50 border-blue-200/50 focus:border-blue-400"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()
                }
                className="border-blue-200 text-blue-600 hover:bg-blue-50">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </div>

            {formData.attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Attached files:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        Attachment {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-blue-200/50">
          <div className="flex gap-2">
            <Button
              onClick={() => handleSubmit(false)}
              disabled={isLoading}
              variant="outline"
              className="border-blue-200 text-blue-600 hover:bg-blue-50">
              {isLoading ? (
                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isEditing ? 'Update Draft' : 'Save as Draft'}
            </Button>

            <Button
              onClick={() => handleSubmit(true)}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
              {isLoading ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {isEditing ? 'Update & Publish' : 'Publish Now'}
            </Button>
          </div>

          <div className="flex gap-2 ml-auto">
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-gray-200 text-gray-600 hover:bg-gray-50">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Announcement Preview</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {formData.title || 'Announcement Title'}
                    </h3>
                    <div className="whitespace-pre-wrap text-gray-700">
                      {formData.content ||
                        'Announcement content will appear here...'}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              onClick={onCancel}
              variant="outline"
              className="border-gray-200 text-gray-600 hover:bg-gray-50">
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
