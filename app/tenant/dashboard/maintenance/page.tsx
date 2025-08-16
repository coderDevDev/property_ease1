'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  LucidePenTool,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Plus,
  Calendar,
  MessageSquare,
  Image as ImageIcon,
  Upload,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { TenantAPI } from '@/lib/api/tenant';

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  scheduled_date?: string;
  completed_date?: string;
  images?: string[];
  comments?: {
    id: string;
    user_id: string;
    user_name: string;
    message: string;
    created_at: string;
  }[];
}

interface MaintenanceStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
}

export default function MaintenancePage() {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [stats, setStats] = useState<MaintenanceStats | null>(null);
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<MaintenanceRequest | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    type: '',
    priority: 'medium'
  });

  useEffect(() => {
    const fetchRequests = async () => {
      if (!authState.user?.id) return;

      try {
        setLoading(true);
        const result = await TenantAPI.getMaintenanceRequests(
          authState.user.id
        );

        if (result.success && result.data) {
          setRequests(result.data.requests);
          setStats(result.data.stats);
        } else {
          toast.error('Failed to load maintenance requests');
        }
      } catch (error) {
        console.error('Failed to fetch maintenance requests:', error);
        toast.error('Failed to load maintenance requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [authState.user?.id]);

  const handleSubmitRequest = async () => {
    if (!authState.user?.id) return;

    try {
      setSubmitting(true);
      const result = await TenantAPI.createMaintenanceRequest(
        authState.user.id,
        {
          ...newRequest,
          images: uploadedImages
        }
      );

      if (result.success) {
        setRequests(prev => [result.data!, ...prev]);
        setShowNewRequestDialog(false);
        setNewRequest({
          title: '',
          description: '',
          type: '',
          priority: 'medium'
        });
        setUploadedImages([]);
        toast.success('Maintenance request submitted successfully');
      } else {
        toast.error(result.message || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Failed to submit request:', error);
      toast.error('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!authState.user?.id || !selectedRequest || !newComment.trim()) return;

    try {
      setSubmitting(true);
      const result = await TenantAPI.addMaintenanceComment(
        selectedRequest.id,
        newComment
      );

      if (result.success && result.data) {
        setRequests(prev =>
          prev.map(request =>
            request.id === selectedRequest.id
              ? {
                  ...request,
                  comments: [...(request.comments || []), result.data]
                }
              : request
          )
        );
        setNewComment('');
        toast.success('Comment added successfully');
      } else {
        toast.error(result.message || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files).filter(file => {
      const isValid =
        file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024;
      if (!isValid) {
        toast.error(
          `${file.name} is not a valid image or is too large (max 5MB)`
        );
      }
      return isValid;
    });

    setUploadedImages(prev => [...prev, ...newFiles]);
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const filteredRequests = requests.filter(request => {
    const matchesFilter = filter === 'all' || request.status === filter;
    const matchesSearch =
      searchQuery === '' ||
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading maintenance requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Maintenance</h1>
          <p className="text-gray-600">
            Submit and track maintenance requests for your property
          </p>
        </div>
        <Button
          onClick={() => setShowNewRequestDialog(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <LucidePenTool className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.total || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.pending || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <LucidePenTool className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.in_progress || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.completed || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search requests..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Requests List */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LucidePenTool className="w-5 h-5 text-blue-600" />
            Maintenance Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-8">
                <LucidePenTool className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Requests Found
                </h3>
                <p className="text-gray-600">
                  {searchQuery
                    ? 'No requests match your search criteria'
                    : 'You have not submitted any maintenance requests yet'}
                </p>
              </div>
            ) : (
              filteredRequests.map(request => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedRequest(request);
                    setShowDetailsDialog(true);
                  }}>
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-full ${
                        request.status === 'completed'
                          ? 'bg-green-100'
                          : request.status === 'in_progress'
                          ? 'bg-orange-100'
                          : request.status === 'pending'
                          ? 'bg-yellow-100'
                          : 'bg-red-100'
                      }`}>
                      <LucidePenTool
                        className={`w-4 h-4 ${
                          request.status === 'completed'
                            ? 'text-green-600'
                            : request.status === 'in_progress'
                            ? 'text-orange-600'
                            : request.status === 'pending'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {request.title}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                        {request.comments && (
                          <>
                            <MessageSquare className="w-3 h-3" />
                            <span>{request.comments.length} comments</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      className={`${
                        request.priority === 'urgent'
                          ? 'bg-red-100 text-red-700'
                          : request.priority === 'high'
                          ? 'bg-orange-100 text-orange-700'
                          : request.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      } border-0`}>
                      {request.priority.charAt(0).toUpperCase() +
                        request.priority.slice(1)}
                    </Badge>
                    <Badge
                      className={`${
                        request.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : request.status === 'in_progress'
                          ? 'bg-orange-100 text-orange-700'
                          : request.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      } border-0`}>
                      {request.status === 'in_progress'
                        ? 'In Progress'
                        : request.status.charAt(0).toUpperCase() +
                          request.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* New Request Dialog */}
      <Dialog
        open={showNewRequestDialog}
        onOpenChange={setShowNewRequestDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>New Maintenance Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={newRequest.title}
                onChange={e =>
                  setNewRequest(prev => ({ ...prev, title: e.target.value }))
                }
                placeholder="Brief description of the issue"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newRequest.description}
                onChange={e =>
                  setNewRequest(prev => ({
                    ...prev,
                    description: e.target.value
                  }))
                }
                placeholder="Detailed description of the maintenance issue"
                className="min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newRequest.type}
                  onValueChange={value =>
                    setNewRequest(prev => ({ ...prev, type: value }))
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="hvac">HVAC</SelectItem>
                    <SelectItem value="appliance">Appliance</SelectItem>
                    <SelectItem value="structural">Structural</SelectItem>
                    <SelectItem value="pest">Pest Control</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={newRequest.priority}
                  onValueChange={(value: any) =>
                    setNewRequest(prev => ({ ...prev, priority: value }))
                  }>
                  <SelectTrigger>
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
            <div className="space-y-2">
              <Label>Images</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {uploadedImages.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full border-red-200 hover:bg-red-50"
                      onClick={() => removeImage(index)}>
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}
                {uploadedImages.length < 6 && (
                  <div className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors">
                    <label className="cursor-pointer text-center p-2">
                      <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                      <span className="text-sm text-gray-600">
                        Upload Image
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Upload up to 6 images (max 5MB each)
              </p>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              onClick={handleSubmitRequest}
              disabled={submitting}>
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Maintenance Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6 py-4">
              {/* Request Info */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedRequest.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`${
                        selectedRequest.priority === 'urgent'
                          ? 'bg-red-100 text-red-700'
                          : selectedRequest.priority === 'high'
                          ? 'bg-orange-100 text-orange-700'
                          : selectedRequest.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      } border-0`}>
                      {selectedRequest.priority.charAt(0).toUpperCase() +
                        selectedRequest.priority.slice(1)}
                    </Badge>
                    <Badge
                      className={`${
                        selectedRequest.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : selectedRequest.status === 'in_progress'
                          ? 'bg-orange-100 text-orange-700'
                          : selectedRequest.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      } border-0`}>
                      {selectedRequest.status === 'in_progress'
                        ? 'In Progress'
                        : selectedRequest.status.charAt(0).toUpperCase() +
                          selectedRequest.status.slice(1)}
                    </Badge>
                  </div>
                </div>
                <p className="text-gray-700">{selectedRequest.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Submitted:{' '}
                      {new Date(
                        selectedRequest.created_at
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  {selectedRequest.scheduled_date && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        Scheduled:{' '}
                        {new Date(
                          selectedRequest.scheduled_date
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Images */}
              {selectedRequest.images && selectedRequest.images.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Images</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedRequest.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Request ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(image, '_blank')}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Comments</h4>
                <div className="space-y-4 max-h-[300px] overflow-y-auto">
                  {selectedRequest.comments?.map(comment => (
                    <div
                      key={comment.id}
                      className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-gray-900">
                            {comment.user_name}
                          </p>
                          <span className="text-sm text-gray-600">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || submitting}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                    {submitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      'Send'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
