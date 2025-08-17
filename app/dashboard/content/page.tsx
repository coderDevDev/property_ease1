'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Shield,
  Search,
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MoreHorizontal,
  Flag,
  MessageSquare,
  FileText,
  User
} from 'lucide-react';
import { AdminAPI } from '@/lib/api/admin';
import { toast } from 'sonner';

interface ReportedContent {
  id: string;
  content_type: 'announcement' | 'message' | 'document' | 'comment';
  content_id: string;
  content_title?: string;
  content_text?: string;
  reason: 'spam' | 'inappropriate' | 'harassment' | 'false_info' | 'other';
  status: 'pending' | 'approved' | 'rejected' | 'removed';
  reported_by: string;
  created_at: string;
  reviewed_at?: string;
  reviewer_notes?: string;
  action_taken?: string;
}

interface ReportedContentWithDetails extends ReportedContent {
  reporter: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export default function ContentModerationPage() {
  const [reportedContent, setReportedContent] = useState<
    ReportedContentWithDetails[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedContent, setSelectedContent] =
    useState<ReportedContentWithDetails | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionTaken, setActionTaken] = useState('');

  useEffect(() => {
    loadReportedContent();
  }, [statusFilter]);

  const loadReportedContent = async () => {
    try {
      setIsLoading(true);
      const result = await AdminAPI.getReportedContent();
      if (result.success) {
        setReportedContent(result.data);
      } else {
        toast.error('Failed to load reported content');
      }
    } catch (error) {
      console.error('Failed to load reported content:', error);
      toast.error('Failed to load reported content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentReview = async (
    contentId: string,
    status: 'approved' | 'rejected' | 'removed'
  ) => {
    try {
      // This would call a content moderation API
      // const result = await AdminAPI.reviewContent(contentId, status, reviewNotes, actionTaken);

      toast.success(`Content ${status} successfully`);
      setIsReviewDialogOpen(false);
      setReviewNotes('');
      setActionTaken('');
      loadReportedContent();
    } catch (error) {
      console.error('Failed to review content:', error);
      toast.error('Failed to review content');
    }
  };

  const filteredContent = reportedContent.filter(content => {
    const matchesSearch =
      content.content_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.content_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.reporter?.first_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      content.reporter?.last_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || content.status === statusFilter;
    const matchesType =
      typeFilter === 'all' || content.content_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <MessageSquare className="w-4 h-4" />;
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'removed':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Flag className="w-4 h-4" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'removed':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getReasonBadgeColor = (reason: string) => {
    switch (reason) {
      case 'spam':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'inappropriate':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'harassment':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'false_info':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'other':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const totalReports = reportedContent.length;
  const pendingReports = reportedContent.filter(c => c.status === 'pending');
  const approvedReports = reportedContent.filter(c => c.status === 'approved');
  const removedReports = reportedContent.filter(
    c => c.status === 'removed' || c.status === 'rejected'
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Content Moderation
          </h1>
          <p className="text-gray-600">Review and moderate reported content</p>
        </div>
        <Badge variant="outline" className="border-blue-200 text-blue-700">
          {filteredContent.length} Reports
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Reports
            </CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {totalReports}
            </div>
            <p className="text-xs text-gray-600 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Review
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">
              {pendingReports.length}
            </div>
            <p className="text-xs text-gray-600 mt-1">Awaiting action</p>
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Approved
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {approvedReports.length}
            </div>
            <p className="text-xs text-gray-600 mt-1">Content kept</p>
          </CardContent>
        </Card>

        <Card className="border-red-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Removed/Rejected
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {removedReports.length}
            </div>
            <p className="text-xs text-gray-600 mt-1">Action taken</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Reports</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search by content, reporter, or reason..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="removed">Removed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type-filter">Content Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="announcement">Announcements</SelectItem>
                  <SelectItem value="message">Messages</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="comment">Comments</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Content Reports ({filteredContent.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reported</TableHead>
                  <TableHead>Reviewed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContent.map(content => (
                  <TableRow key={content.id}>
                    <TableCell>
                      <div>
                        {content.content_title && (
                          <div className="font-medium text-gray-900 mb-1">
                            {content.content_title}
                          </div>
                        )}
                        {content.content_text && (
                          <div className="text-sm text-gray-500 line-clamp-2">
                            {content.content_text}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          ID: {content.content_id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {getContentIcon(content.content_type)}
                        <span className="ml-1">{content.content_type}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${getReasonBadgeColor(
                          content.reason
                        )} capitalize`}>
                        <Flag className="w-3 h-3 mr-1" />
                        {content.reason === 'false_info'
                          ? 'False Info'
                          : content.reason}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {content.reporter ? (
                        <div>
                          <div className="font-medium text-gray-900 flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {content.reporter.first_name}{' '}
                            {content.reporter.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {content.reporter.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500">Unknown reporter</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${getStatusBadgeColor(
                          content.status
                        )} capitalize`}>
                        {getStatusIcon(content.status)}
                        <span className="ml-1">{content.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(content.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {content.reviewed_at ? (
                        <div className="text-sm text-gray-900">
                          {new Date(content.reviewed_at).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedContent(content);
                              setIsReviewDialogOpen(true);
                            }}>
                            <Eye className="w-4 h-4 mr-2" />
                            Review Content
                          </DropdownMenuItem>
                          {content.status === 'pending' && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleContentReview(content.id, 'approved')
                                }>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleContentReview(content.id, 'rejected')
                                }>
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleContentReview(content.id, 'removed')
                                }>
                                <XCircle className="w-4 h-4 mr-2" />
                                Remove Content
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredContent.length === 0 && (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No reports found
              </h3>
              <p className="text-gray-600">
                {searchTerm
                  ? 'Try adjusting your search criteria.'
                  : 'No reports match the current filters.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Reported Content</DialogTitle>
            <DialogDescription>
              Review the reported content and take appropriate action
            </DialogDescription>
          </DialogHeader>
          {selectedContent && (
            <div className="space-y-6">
              {/* Content Preview */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  {getContentIcon(selectedContent.content_type)}
                  <span className="font-medium capitalize">
                    {selectedContent.content_type}
                  </span>
                  <Badge
                    className={getReasonBadgeColor(selectedContent.reason)}>
                    {selectedContent.reason}
                  </Badge>
                </div>
                {selectedContent.content_title && (
                  <h4 className="font-medium text-gray-900 mb-2">
                    {selectedContent.content_title}
                  </h4>
                )}
                {selectedContent.content_text && (
                  <p className="text-sm text-gray-700">
                    {selectedContent.content_text}
                  </p>
                )}
              </div>

              {/* Reporter Info */}
              <div>
                <Label>Reported By</Label>
                <div className="mt-1 text-sm">
                  {selectedContent.reporter ? (
                    <span>
                      {selectedContent.reporter.first_name}{' '}
                      {selectedContent.reporter.last_name}(
                      {selectedContent.reporter.email})
                    </span>
                  ) : (
                    'Unknown reporter'
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Reported on{' '}
                  {new Date(selectedContent.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Review Actions */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="review-notes">Review Notes</Label>
                  <Textarea
                    id="review-notes"
                    placeholder="Add notes about your review decision..."
                    value={reviewNotes}
                    onChange={e => setReviewNotes(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="action-taken">Action Taken</Label>
                  <Input
                    id="action-taken"
                    placeholder="Describe the action taken..."
                    value={actionTaken}
                    onChange={e => setActionTaken(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() =>
                      handleContentReview(selectedContent.id, 'approved')
                    }
                    className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Content
                  </Button>
                  <Button
                    onClick={() =>
                      handleContentReview(selectedContent.id, 'rejected')
                    }
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50">
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Report
                  </Button>
                  <Button
                    onClick={() =>
                      handleContentReview(selectedContent.id, 'removed')
                    }
                    variant="destructive">
                    <XCircle className="w-4 h-4 mr-2" />
                    Remove Content
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







