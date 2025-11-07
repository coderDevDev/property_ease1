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

      const result = await DocumentsAPI.approveDocument(documentId);

      if (result.success) {
        toast.success('Document approved successfully');
        await loadDocuments();
        onDocumentsUpdated?.();
      } else {
        toast.error(result.message || 'Failed to approve document');
      }
    } catch (error) {
      console.error('Approve error:', error);
      toast.error('Failed to approve document');
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

      const result = await DocumentsAPI.rejectDocument(documentId, rejectionReason);

      if (result.success) {
        toast.success('Document rejected successfully');
        setRejectionReason('');
        setRejectingDocId(null);
        await loadDocuments();
        onDocumentsUpdated?.();
      } else {
        toast.error(result.message || 'Failed to reject document');
      }
    } catch (error) {
      console.error('Reject error:', error);
      toast.error('Failed to reject document');
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
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading documents...</p>
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
                  <Card key={doc.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        {/* Document Info */}
                        <div className="flex items-start gap-3 flex-1">
                          <FileText className="w-10 h-10 text-blue-600 flex-shrink-0 mt-1" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900">
                                {getRequirementName(doc.document_type)}
                              </h4>
                              {getStatusBadge(doc.status)}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {doc.document_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(doc.file_size / 1024 / 1024).toFixed(2)} MB •{' '}
                              Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                            </p>

                            {/* Rejection Reason */}
                            {doc.status === 'rejected' && doc.rejection_reason && (
                              <Alert className="mt-2 bg-red-50 border-red-200">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-red-800 text-xs">
                                  <strong>Rejection Reason:</strong> {doc.rejection_reason}
                                </AlertDescription>
                              </Alert>
                            )}

                            {/* Rejection Input */}
                            {rejectingDocId === doc.id && (
                              <div className="mt-3 space-y-2">
                                <Textarea
                                  placeholder="Enter rejection reason..."
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  className="min-h-[80px]"
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

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(doc.file_url, '_blank')}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>

                          {doc.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApprove(doc.id)}
                                disabled={processingDoc === doc.id}
                              >
                                {processingDoc === doc.id ? (
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                )}
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setRejectingDocId(doc.id);
                                  setRejectionReason('');
                                }}
                                disabled={processingDoc === doc.id}
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}

                          {doc.status === 'approved' && (
                            <Badge className="bg-green-100 text-green-700 justify-center">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approved
                            </Badge>
                          )}

                          {doc.status === 'rejected' && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApprove(doc.id)}
                              disabled={processingDoc === doc.id}
                            >
                              {processingDoc === doc.id ? (
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              )}
                              Approve
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}