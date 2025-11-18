'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DocumentsAPI, DocumentRequirement, PropertyDocument } from '@/lib/api/documents';
import { PropertiesAPI } from '@/lib/api/properties';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Trash2,
  Download,
  ArrowLeft,
  FileCheck
} from 'lucide-react';



export default function PropertyDocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const [requirements, setRequirements] = useState<DocumentRequirement[]>([]);
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [propertyId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load requirements, documents, and property info in parallel
      const [reqResult, docsResult, propResult] = await Promise.all([
        DocumentsAPI.getDocumentRequirements(),
        DocumentsAPI.getPropertyDocuments(propertyId),
        PropertiesAPI.getPropertyById(propertyId)
      ]);

      if (reqResult.success) {
        setRequirements(reqResult.data);
      }

      if (docsResult.success) {
        setDocuments(docsResult.data);
      }

      if (propResult.success) {
        setProperty(propResult.data);
      }
    } catch (error) {
      console.error('Load data error:', error);
      toast.error('Failed to load document information');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (requirement: DocumentRequirement, file: File) => {
    try {
      // Validate file size
      if (file.size > requirement.max_file_size) {
        toast.error(`File size exceeds ${(requirement.max_file_size / 1024 / 1024).toFixed(0)}MB limit`);
        return;
      }

      // Validate file type
      if (!requirement.allowed_mime_types.includes(file.type)) {
        toast.error('Invalid file type. Only PDF, JPG, and PNG are allowed');
        return;
      }

      setUploading(requirement.document_type);

      const result = await DocumentsAPI.uploadPropertyDocument(
        propertyId,
        requirement.document_type,
        file
      );

      if (result.success) {
        toast.success('Document uploaded successfully');
        await loadData(); // Reload to get updated documents
      } else {
        toast.error(result.message || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(null);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const result = await DocumentsAPI.deletePropertyDocument(documentId);

      if (result.success) {
        toast.success('Document deleted successfully');
        await loadData();
      } else {
        toast.error(result.message || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    }
  };

  const getDocumentForRequirement = (documentType: string): PropertyDocument | undefined => {
    return documents.find(doc => doc.document_type === documentType);
  };

  const getStatusBadge = (document?: PropertyDocument) => {
    if (!document) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-700">
          <Upload className="w-3 h-3 mr-1" />
          Not Uploaded
        </Badge>
      );
    }

    switch (document.status) {
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

  const allRequiredDocsUploaded = () => {
    const requiredDocs = requirements.filter(req => req.is_required);
    return requiredDocs.every(req => getDocumentForRequirement(req.document_type));
  };

  const getOverallStatus = () => {
    if (!property) return null;

    if (property.documents_approved) {
      return (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            All documents approved! Your property is ready for final approval.
          </AlertDescription>
        </Alert>
      );
    }

    if (property.documents_complete) {
      return (
        <Alert className="bg-blue-50 border-blue-200">
          <Clock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            All required documents submitted. Waiting for admin review.
          </AlertDescription>
        </Alert>
      );
    }

    const rejectedDocs = documents.filter(doc => doc.status === 'rejected');
    if (rejectedDocs.length > 0) {
      return (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {rejectedDocs.length} document(s) rejected. Please review and re-upload.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert className="bg-yellow-50 border-yellow-200">
        <Upload className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          Please upload all required documents to submit your property for review.
        </AlertDescription>
      </Alert>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/owner/dashboard/properties')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Properties
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Property Documents</h1>
            <p className="text-gray-600 mt-1">
              {property?.name || 'Upload required documents for verification'}
            </p>
          </div>
          <FileCheck className="w-12 h-12 text-blue-600" />
        </div>
      </div>

      {/* Overall Status */}
      <div className="mb-6">
        {getOverallStatus()}
      </div>

      {/* Progress Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upload Progress</CardTitle>
          <CardDescription>
            {documents.length} of {requirements.filter(r => r.is_required).length} required documents uploaded
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {requirements.filter(r => r.is_required).map(req => {
              const doc = getDocumentForRequirement(req.document_type);
              return (
                <div
                  key={req.id}
                  className={`h-2 flex-1 rounded-full ${
                    doc
                      ? doc.status === 'approved'
                        ? 'bg-green-500'
                        : doc.status === 'rejected'
                        ? 'bg-red-500'
                        : 'bg-yellow-500'
                      : 'bg-gray-200'
                  }`}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Document Upload Cards */}
      <div className="space-y-4">
        {requirements.map(requirement => {
          const existingDoc = getDocumentForRequirement(requirement.document_type);
          const isUploading = uploading === requirement.document_type;

          return (
            <Card key={requirement.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">
                        {requirement.display_name}
                        {requirement.is_required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </CardTitle>
                      {getStatusBadge(existingDoc)}
                    </div>
                    <CardDescription className="mt-1">
                      {requirement.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                {/* Existing Document */}
                {existingDoc && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-blue-600" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">
                              {existingDoc.document_name}
                            </p>
                            {(existingDoc as any).version && (existingDoc as any).version > 1 && (
                              <Badge variant="outline" className="text-xs">
                                v{(existingDoc as any).version}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {(existingDoc.file_size / 1024 / 1024).toFixed(2)} MB •{' '}
                            Uploaded {new Date(existingDoc.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(existingDoc.file_url, '_blank')}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        {existingDoc.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteDocument(existingDoc.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Rejection Reason */}
                    {existingDoc.status === 'rejected' && existingDoc.rejection_reason && (
                      <Alert className="mt-3 bg-red-50 border-red-200">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          <strong>Rejection Reason:</strong> {existingDoc.rejection_reason}
                          <p className="mt-2 text-sm">
                            📤 Please upload a new version below addressing the issues mentioned above.
                            Your previous document will be kept for reference.
                          </p>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {/* Upload Area */}
                {(!existingDoc || existingDoc.status === 'rejected') && (
                  <div>
                    <label
                      htmlFor={`file-${requirement.document_type}`}
                      className={
                        `block w-full p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
                          isUploading
                            ? 'border-blue-400 bg-blue-50'
                            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                        }`
                      }
                    >
                      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-sm font-medium text-gray-700">
                        {isUploading
                          ? 'Uploading...'
                          : existingDoc?.status === 'rejected'
                          ? '📤 Upload New Version (Previous version will be kept)'
                          : 'Click to upload or drag and drop'
                        }
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PDF, JPG, PNG (Max {(requirement.max_file_size / 1024 / 1024).toFixed(0)}MB)
                      </p>
                    </label>
                    <input
                      id={`file-${requirement.document_type}`}
                      type="file"
                      className="hidden"
                      accept={requirement.allowed_mime_types.join(',')}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(requirement, file);
                        }
                      }}
                      disabled={isUploading}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Submit Button */}
      {allRequiredDocsUploaded() && !property?.documents_complete && (
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                All Required Documents Uploaded!
              </h3>
              <p className="text-blue-700 mb-4">
                Your documents have been automatically submitted for admin review.
              </p>
              <Button
                onClick={() => router.push('/owner/dashboard/properties')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Return to Properties
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}