'use client';

import { useState, useEffect } from 'react';
import { DocumentsAPI, PropertyDocument, DocumentRequirement } from '@/lib/api/documents';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  AlertCircle,
  Eye,
  FileCheck,
  Loader2
} from 'lucide-react';

interface DocumentReviewModalProps {
  propertyId: string;
  propertyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentsUpdated?: () => void;
}

export function DocumentReviewModal({
  propertyId,
  propertyName,
  open,
  onOpenChange,
  onDocumentsUpdated
}: DocumentReviewModalProps) {
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingDoc, setProcessingDoc] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadDocuments();
    }
  }, [open, propertyId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);

      const [docsResult, reqResult] = await Promise.all([
        DocumentsAPI.getPropertyDocuments(propertyId),
        DocumentsAPI.getDocumentRequirements()
      ]);

      if (docsResult.success) {
        setDocuments(docsResult.data);
      }

      if (reqResult.success) {
        setRequirements(reqResult.data);
      }
    } catch (error) {
      console.error('Load documents error:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (documentId: string) => {
    try {
      setProcessingDoc(documentId);

      // Optimistic update - update UI immediately
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, status: 'approved' as PropertyDocument['status'] }
          : doc
      ));

      const result = await DocumentsAPI.approveDocument(documentId);

      if (result.success) {
        toast.success('Document approved successfully');
        // Only call parent update, no need to reload documents
        onDocumentsUpdated?.();
      } else {
        // Revert optimistic update on error
        toast.error(result.message || 'Failed to approve document');
        await loadDocuments();
      }
    } catch (error) {
      console.error('Approve error:', error);
      toast.error('Failed to approve document');
      // Revert optimistic update on error
      await loadDocuments();
    } finally {
      setProcessingDoc(null);
    }
  };

  const handleReject = async (documentId: string) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setProcessingDoc(documentId);

      // Optimistic update - update UI immediately
      const currentReason = rejectionReason;
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, status: 'rejected' as PropertyDocument['status'], rejection_reason: currentReason }
          : doc
      ));
      setRejectionReason('');
      setRejectingDocId(null);

      const result = await DocumentsAPI.rejectDocument(documentId, currentReason);

      if (result.success) {
        toast.success('Document rejected successfully');
        // Only call parent update, no need to reload documents
        onDocumentsUpdated?.();
      } else {
        // Revert optimistic update on error
        toast.error(result.message || 'Failed to reject document');
        await loadDocuments();
      }
    } catch (error) {
      console.error('Reject error:', error);
      toast.error('Failed to reject document');
      // Revert optimistic update on error
      await loadDocuments();
    } finally {
      setProcessingDoc(null);
    }
  };

  const getStatusBadge = (status: PropertyDocument['status']) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending Review
          </Badge>
        );
    }
  };

  const getRequirementName = (documentType: string) => {
    const req = requirements.find(r => r.document_type === documentType);
    return req?.display_name || documentType;
  };

  const getDocumentStats = () => {
    const total = documents.length;
    const approved = documents.filter(d => d.status === 'approved').length;
    const rejected = documents.filter(d => d.status === 'rejected').length;
    const pending = documents.filter(d => d.status === 'pending').length;

    return { total, approved, rejected, pending };
  };

  const stats = getDocumentStats();
  const allApproved = stats.total > 0 && stats.approved === stats.total;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-600" />
            Review Property Documents
          </DialogTitle>
          <DialogDescription>
            {propertyName}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            {/* Skeleton Loaders */}
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-4 pb-3">
                    <div className="text-center space-y-2">
                      <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mx-auto"></div>
                      <div className="h-3 w-12 bg-gray-200 animate-pulse rounded mx-auto"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Document Skeleton Cards */}
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-start">
                      <div className="flex-1 p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gray-200 animate-pulse rounded-lg w-12 h-12"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-5 bg-gray-200 animate-pulse rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2"></div>
                            <div className="h-3 bg-gray-200 animate-pulse rounded w-2/3"></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 p-4 bg-gray-50 border-l min-w-[140px]">
                        <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
                        <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-3">
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    <p className="text-xs text-gray-600">Total</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                    <p className="text-xs text-gray-600">Approved</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                    <p className="text-xs text-gray-600">Pending</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                    <p className="text-xs text-gray-600">Rejected</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Overall Status */}
            {allApproved && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  All documents approved! Property is ready for final approval.
                </AlertDescription>
              </Alert>
            )}

            {stats.pending > 0 && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <Clock className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  {stats.pending} document(s) pending review.
                </AlertDescription>
              </Alert>
            )}

            {/* Documents List */}
            {documents.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No documents uploaded yet for this property.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <Card key={doc.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      <div className="flex items-start">
                        {/* Document Info Section */}
                        <div className="flex-1 p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                              <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-gray-900 text-base">
                                  {getRequirementName(doc.document_type)}
                                </h4>
                                {getStatusBadge(doc.status)}
                              </div>
                              <p className="text-sm text-gray-600 mb-1 truncate">
                                {doc.document_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(doc.file_size / 1024 / 1024).toFixed(2)} MB • Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                              </p>

                              {/* Rejection Reason */}
                              {doc.status === 'rejected' && doc.rejection_reason && !rejectingDocId && (
                                <Alert className="mt-3 bg-red-50 border-red-200">
                                  <AlertCircle className="h-4 w-4 text-red-600" />
                                  <AlertDescription className="text-red-800 text-xs">
                                    <strong>Rejection Reason:</strong> {doc.rejection_reason}
                                  </AlertDescription>
                                </Alert>
                              )}

                              {/* Rejection Input */}
                              {rejectingDocId === doc.id && (
                                <div className="mt-3 space-y-2">
                                  <label className="text-sm font-medium text-gray-700">Rejection Reason</label>
                                  <Textarea
                                    placeholder="Enter detailed rejection reason..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="min-h-[80px]"
                                    autoFocus
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleReject(doc.id)}
                                      disabled={processingDoc === doc.id || !rejectionReason.trim()}
                                    >
                                      {processingDoc === doc.id ? (
                                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                      ) : (
                                        <XCircle className="w-3 h-3 mr-1" />
                                      )}
                                      Confirm Reject
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setRejectingDocId(null);
                                        setRejectionReason('');
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions Section */}
                        <div className="flex flex-col gap-2 p-4 bg-gray-50 border-l min-w-[140px]">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => window.open(doc.file_url, '_blank')}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View File
                          </Button>

                          {/* Status Change Actions */}
                          {rejectingDocId !== doc.id && (
                            <>
                              {doc.status !== 'approved' && (
                                <Button
                                  size="sm"
                                  className="w-full justify-start bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                  onClick={() => handleApprove(doc.id)}
                                  disabled={processingDoc === doc.id || doc.status === 'rejected'}
                                  title={doc.status === 'rejected' ? 'Cannot approve a rejected document' : ''}
                                >
                                  {processingDoc === doc.id ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                  )}
                                  Approve
                                </Button>
                              )}
                              {doc.status !== 'rejected' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="w-full justify-start"
                                  onClick={() => {
                                    setRejectingDocId(doc.id);
                                    setRejectionReason(doc.rejection_reason || '');
                                  }}
                                  disabled={processingDoc === doc.id}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Footer Actions */}

            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
      
      )}
    </DialogContent>
  </Dialog>
);}