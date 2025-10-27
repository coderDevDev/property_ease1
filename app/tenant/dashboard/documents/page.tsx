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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  FileText,
  Search,
  Plus,
  Calendar,
  Download,
  Upload,
  Trash2,
  File,
  AlertCircle,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { TenantAPI } from '@/lib/api/tenant';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploaded_at: string;
  category: string;
  description?: string;
  file_url: string;
}

export default function DocumentsPage() {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [newDocument, setNewDocument] = useState({
    name: '',
    category: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!authState.user?.id) return;

      try {
        setLoading(true);
        const result = await TenantAPI.getDocuments(authState.user.id);

        if (result.success && result.data) {
          setDocuments(result.data);
        } else {
          toast.error('Failed to load documents');
        }
      } catch (error) {
        console.error('Failed to fetch documents:', error);
        toast.error('Failed to load documents');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [authState.user?.id]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploadedFile(file);
    setNewDocument(prev => ({ ...prev, name: file.name }));
  };

  const handleUpload = async () => {
    if (!authState.user?.id || !uploadedFile || !newDocument.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const result = await TenantAPI.uploadDocument(
        uploadedFile,
        newDocument.category,
        newDocument.name,
        newDocument.description
      );

      if (result.success && result.data) {
        setDocuments(prev => [result.data, ...prev]);
        setShowUploadDialog(false);
        setUploadedFile(null);
        setNewDocument({ name: '', category: '', description: '' });
        toast.success('Document uploaded successfully');
      } else {
        toast.error(result.message || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Failed to upload document:', error);
      toast.error('Failed to upload document');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      const result = await TenantAPI.downloadDocument(document.id);
      if (result.success && result.url) {
        window.open(result.url, '_blank');
      } else {
        toast.error('Failed to download document');
      }
    } catch (error) {
      console.error('Failed to download document:', error);
      toast.error('Failed to download document');
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      const result = await TenantAPI.deleteDocument(documentId);
      if (result.success) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        toast.success('Document deleted successfully');
      } else {
        toast.error(result.message || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
      toast.error('Failed to delete document');
    }
  };

  const filteredDocuments = documents.filter(document => {
    const matchesFilter = filter === 'all' || document.category === filter;
    const matchesSearch =
      searchQuery === '' ||
      document.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      document.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const categories = Array.from(new Set(documents.map(doc => doc.category)));

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Documents</h1>
          <p className="text-gray-600">
            Manage and access your important documents
          </p>
        </div>
        <Button
          onClick={() => setShowUploadDialog(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Documents List */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            My Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-8">
                <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Documents Found
                </h3>
                <p className="text-gray-600">
                  {searchQuery
                    ? 'No documents match your search criteria'
                    : 'You haven not uploaded any documents yet'}
                </p>
              </div>
            ) : (
              filteredDocuments.map(document => (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {document.name}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(
                              document.uploaded_at
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <span>{formatFileSize(document.size)}</span>
                      </div>
                      {document.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {document.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-700 border-0">
                      {document.category.charAt(0).toUpperCase() +
                        document.category.slice(1)}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() => handleDownload(document)}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(document.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>File</Label>
              {uploadedFile ? (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {uploadedFile.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatFileSize(uploadedFile.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 border-red-200 text-red-700 hover:bg-red-50"
                    onClick={() => setUploadedFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <label className="w-full cursor-pointer">
                    <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        Maximum file size: 10MB
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={newDocument.category}
                onValueChange={value =>
                  setNewDocument(prev => ({ ...prev, category: value }))
                }>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lease">Lease Agreement</SelectItem>
                  <SelectItem value="identification">Identification</SelectItem>
                  <SelectItem value="financial">Financial Documents</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="maintenance">
                    Maintenance Records
                  </SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newDocument.name}
                onChange={e =>
                  setNewDocument(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter document name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Input
                value={newDocument.description}
                onChange={e =>
                  setNewDocument(prev => ({
                    ...prev,
                    description: e.target.value
                  }))
                }
                placeholder="Enter document description"
              />
            </div>
            <Button
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              onClick={handleUpload}
              disabled={submitting || !uploadedFile || !newDocument.category}>
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
