'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Send,
  Paperclip,
  X,
  User,
  Home,
  MessageSquare,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import {
  MessagesAPI,
  type MessageFormData,
  type Conversation
} from '@/lib/api/messages';

interface MessageFormProps {
  conversation?: Conversation;
  recipientId?: string;
  propertyId?: string;
  role: 'owner' | 'tenant';
  currentUserId: string;
  onMessageSent?: (message: any) => void;
  onCancel?: () => void;
  className?: string;
}

export function MessageForm({
  conversation,
  recipientId,
  propertyId,
  role,
  currentUserId,
  onMessageSent,
  onCancel,
  className
}: MessageFormProps) {
  const [formData, setFormData] = useState<MessageFormData>({
    recipient_id: recipientId || '',
    property_id: propertyId,
    subject: '',
    content: '',
    message_type: 'direct',
    attachments: []
  });

  const [availableRecipients, setAvailableRecipients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load available recipients
  useEffect(() => {
    const loadRecipients = async () => {
      try {
        const result = await MessagesAPI.getAvailableRecipients(
          currentUserId,
          role
        );
        if (result.success) {
          setAvailableRecipients(result.data || []);
        }
      } catch (error) {
        console.error('Failed to load recipients:', error);
      }
    };

    loadRecipients();
  }, [currentUserId, role]);

  // Update form data when props change
  useEffect(() => {
    if (recipientId) {
      setFormData(prev => ({ ...prev, recipient_id: recipientId }));
    }
    if (propertyId) {
      setFormData(prev => ({ ...prev, property_id: propertyId }));
    }
  }, [recipientId, propertyId]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.recipient_id) {
      newErrors.recipient_id = 'Recipient is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Message content is required';
    }

    if (formData.content.length > 5000) {
      newErrors.content = 'Message content must be less than 5000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      const result = await MessagesAPI.sendMessage(formData, currentUserId);

      if (result.success) {
        onMessageSent?.(result.data);
        // Reset form
        setFormData({
          recipient_id: recipientId || '',
          property_id: propertyId,
          subject: '',
          content: '',
          message_type: 'direct',
          attachments: []
        });
        setErrors({});
      } else {
        setErrors({ submit: result.message || 'Failed to send message' });
      }
    } catch (error) {
      console.error('Send message error:', error);
      setErrors({ submit: 'Failed to send message' });
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

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'maintenance':
        return '🔧';
      case 'payment':
        return '💰';
      case 'general':
        return '💬';
      default:
        return '📧';
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'maintenance':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'payment':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'general':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const selectedRecipient = availableRecipients.find(
    r => r.id === formData.recipient_id
  );

  return (
    <Card
      className={cn(
        'bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg',
        className
      )}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <MessageSquare className="w-5 h-5" />
          {conversation ? 'Reply to Message' : 'Send New Message'}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recipient Selection */}
          {!conversation && (
            <div className="space-y-2">
              <Label htmlFor="recipient" className="text-gray-700 font-medium">
                Send To *
              </Label>
              <Select
                value={formData.recipient_id}
                onValueChange={value =>
                  handleInputChange('recipient_id', value)
                }>
                <SelectTrigger
                  className={cn(
                    'bg-white/50 border-blue-200/50 focus:border-blue-400',
                    errors.recipient_id && 'border-red-300 focus:border-red-400'
                  )}>
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  {availableRecipients.map(recipient => (
                    <SelectItem key={recipient.id} value={recipient.id}>
                      <div className="flex items-center gap-2">
                        <span>{recipient.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {recipient.role}
                        </Badge>
                        {recipient.property && (
                          <span className="text-xs text-gray-500">
                            ({recipient.property.name})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.recipient_id && (
                <p className="text-red-600 text-sm">{errors.recipient_id}</p>
              )}
            </div>
          )}

          {/* Selected Recipient Info */}
          {selectedRecipient && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200/50">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">
                  {selectedRecipient.name}
                </span>
                <Badge variant="outline" className="text-xs">
                  {selectedRecipient.role}
                </Badge>
                {selectedRecipient.property && (
                  <div className="flex items-center gap-1 text-xs text-blue-700">
                    <Home className="w-3 h-3" />
                    <span>{selectedRecipient.property.name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Message Type */}
          <div className="space-y-2">
            <Label htmlFor="message_type" className="text-gray-700 font-medium">
              Message Type
            </Label>
            <Select
              value={formData.message_type}
              onValueChange={value => handleInputChange('message_type', value)}>
              <SelectTrigger className="bg-white/50 border-blue-200/50 focus:border-blue-400">
                <SelectValue placeholder="Select message type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="direct">
                  <div className="flex items-center gap-2">
                    <span>📧</span>
                    <span>Direct Message</span>
                  </div>
                </SelectItem>
                <SelectItem value="maintenance">
                  <div className="flex items-center gap-2">
                    <span>🔧</span>
                    <span>Maintenance Related</span>
                  </div>
                </SelectItem>
                <SelectItem value="payment">
                  <div className="flex items-center gap-2">
                    <span>💰</span>
                    <span>Payment Related</span>
                  </div>
                </SelectItem>
                <SelectItem value="general">
                  <div className="flex items-center gap-2">
                    <span>💬</span>
                    <span>General Inquiry</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-gray-700 font-medium">
              Subject
            </Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={e => handleInputChange('subject', e.target.value)}
              placeholder="Enter message subject (optional)"
              className="bg-white/50 border-blue-200/50 focus:border-blue-400"
            />
          </div>

          {/* Message Content */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-gray-700 font-medium">
              Message *
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={e => handleInputChange('content', e.target.value)}
              placeholder="Type your message here..."
              rows={4}
              className={cn(
                'bg-white/50 border-blue-200/50 focus:border-blue-400',
                errors.content && 'border-red-300 focus:border-red-400'
              )}
            />
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    getMessageTypeColor(formData.message_type)
                  )}>
                  {getMessageTypeIcon(formData.message_type)}{' '}
                  {formData.message_type}
                </Badge>
              </div>
              <span
                className={cn(
                  'text-xs',
                  formData.content.length > 4500
                    ? 'text-red-600'
                    : 'text-gray-500'
                )}>
                {formData.content.length}/5000
              </span>
            </div>
            {errors.content && (
              <p className="text-red-600 text-sm">{errors.content}</p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <p className="text-red-700 text-sm">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white flex-1">
              {isLoading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="border-gray-200 text-gray-600 hover:bg-gray-50">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
