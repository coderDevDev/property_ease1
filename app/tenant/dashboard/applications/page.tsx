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
  ClipboardList,
  Search,
  Calendar,
  Building,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Upload,
  X,
  Filter,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { TenantAPI } from '@/lib/api/tenant';

interface Application {
  id: string;
  property_id: string;
  property_name: string;
  unit_type: string;
  monthly_rent: number;
  move_in_date: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  updated_at: string;
  documents: {
    id: string;
    name: string;
    type: string;
    url: string;
  }[];
  notes?: string;
  rejection_reason?: string;
}

export default function ApplicationsPage() {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!authState.user?.id) return;

      try {
        setLoading(true);
        const result = await TenantAPI.getApplications(authState.user.id);

        if (result.success && result.data) {
          setApplications(result.data);
        } else {
          toast.error('Failed to load applications');
        }
      } catch (error) {
        console.error('Failed to fetch applications:', error);
        toast.error('Failed to load applications');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [authState.user?.id]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files).filter(file => {
      const isValid = file.size <= 10 * 1024 * 1024; // 10MB limit
      if (!isValid) {
        toast.error(`${file.name} is too large (max 10MB)`);
      }
      return isValid;
    });

    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadDocuments = async () => {
    if (!selectedApplication || uploadedFiles.length === 0) return;

    try {
      const result = await TenantAPI.uploadApplicationDocuments(
        selectedApplication.id,
        uploadedFiles
      );

      if (result.success && result.data) {
        setApplications(prev =>
          prev.map(app =>
            app.id === selectedApplication.id
              ? {
                  ...app,
                  documents: [...app.documents, ...(result.data || [])]
                }
              : app
          )
        );
        setUploadedFiles([]);
        toast.success('Documents uploaded successfully');
      } else {
        toast.error(result.message || 'Failed to upload documents');
      }
    } catch (error) {
      console.error('Failed to upload documents:', error);
      toast.error('Failed to upload documents');
    }
  };

  const handleDownloadDocument = async (document: {
    id: string;
    url: string;
  }) => {
    try {
      window.open(document.url, '_blank');
    } catch (error) {
      console.error('Failed to download document:', error);
      toast.error('Failed to download document');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredApplications = applications.filter(application => {
    const matchesFilter = filter === 'all' || application.status === filter;
    const matchesSearch =
      searchQuery === '' ||
      application.property_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      application.unit_type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-3 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-blue-600 font-medium text-sm sm:text-base">
              Loading applications...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
              Applications
            </h1>
            <p className="text-blue-600/70 mt-1 text-sm sm:text-base">
              Track your property rental applications
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search applications..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 focus:border-blue-500 text-sm sm:text-base"
                  />
                </div>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] focus:border-blue-500 text-sm sm:text-base">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Applications</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardContent className="p-0">
            {filteredApplications.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <ClipboardList className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  No Applications Found
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-6">
                  {searchQuery
                    ? 'No applications match your search criteria'
                    : "You haven't submitted any rental applications yet"}
                </p>
                <Button
                  onClick={() =>
                    (window.location.href = '/tenant/dashboard/properties')
                  }
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm sm:text-base">
                  Browse Properties
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredApplications.map(application => (
                  <div
                    key={application.id}
                    className="p-3 sm:p-4 hover:bg-blue-50/30 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedApplication(application);
                      setShowDetailsDialog(true);
                    }}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                          {application.property_name}
                        </h3>
                        <Badge className={getStatusColor(application.status)}>
                          <span className="flex items-center gap-1 text-xs sm:text-sm">
                            {getStatusIcon(application.status)}
                            {application.status.charAt(0).toUpperCase() +
                              application.status.slice(1)}
                          </span>
                        </Badge>
                      </div>
                      <span className="text-xs sm:text-sm text-gray-500">
                        {new Date(
                          application.submitted_at
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Building className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{application.unit_type}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>
                          ₱{application.monthly_rent.toLocaleString()}/month
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>
                          Move-in:{' '}
                          {new Date(
                            application.move_in_date
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{application.documents.length} documents</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Application Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                Application Details
              </DialogTitle>
            </DialogHeader>
            {selectedApplication && (
              <div className="space-y-4 sm:space-y-6 py-4">
                {/* Status */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                  <Badge
                    className={`${getStatusColor(
                      selectedApplication.status
                    )} text-sm sm:text-base`}>
                    <span className="flex items-center gap-2">
                      {getStatusIcon(selectedApplication.status)}
                      {selectedApplication.status.charAt(0).toUpperCase() +
                        selectedApplication.status.slice(1)}
                    </span>
                  </Badge>
                  <span className="text-xs sm:text-sm text-gray-500">
                    Submitted:{' '}
                    {new Date(
                      selectedApplication.submitted_at
                    ).toLocaleDateString()}
                  </span>
                </div>

                {/* Property Details */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    {selectedApplication.property_name}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label className="text-xs sm:text-sm text-gray-600">
                        Unit Type
                      </Label>
                      <p className="font-medium text-gray-900 text-sm sm:text-base">
                        {selectedApplication.unit_type}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm text-gray-600">
                        Monthly Rent
                      </Label>
                      <p className="font-medium text-gray-900 text-sm sm:text-base">
                        ₱{selectedApplication.monthly_rent.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm text-gray-600">
                        Move-in Date
                      </Label>
                      <p className="font-medium text-gray-900 text-sm sm:text-base">
                        {new Date(
                          selectedApplication.move_in_date
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm text-gray-600">
                        Last Updated
                      </Label>
                      <p className="font-medium text-gray-900 text-sm sm:text-base">
                        {new Date(
                          selectedApplication.updated_at
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedApplication.notes && (
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm text-gray-600">
                      Notes
                    </Label>
                    <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base">
                      {selectedApplication.notes}
                    </p>
                  </div>
                )}

                {/* Rejection Reason */}
                {selectedApplication.status === 'rejected' &&
                  selectedApplication.rejection_reason && (
                    <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                      <Label className="text-red-700 text-xs sm:text-sm">
                        Rejection Reason
                      </Label>
                      <p className="text-red-700 mt-1 text-sm sm:text-base">
                        {selectedApplication.rejection_reason}
                      </p>
                    </div>
                  )}

                {/* Documents */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                    <Label className="text-xs sm:text-sm text-gray-600">
                      Documents
                    </Label>
                    {selectedApplication.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-200 text-blue-700 hover:bg-blue-50 text-xs sm:text-sm"
                        onClick={() =>
                          document.getElementById('file-upload')?.click()
                        }>
                        <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        Upload
                      </Button>
                    )}
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      multiple
                      onChange={handleFileUpload}
                    />
                  </div>

                  {/* Uploaded Files Preview */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm text-gray-600">
                        New Files
                      </Label>
                      <div className="space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                              <span className="text-xs sm:text-sm text-gray-700 truncate">
                                {file.name}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => removeFile(index)}>
                              <X className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm sm:text-base"
                          onClick={handleUploadDocuments}>
                          Upload Files
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Existing Documents */}
                  <div className="space-y-2">
                    {selectedApplication.documents.length === 0 ? (
                      <p className="text-xs sm:text-sm text-gray-600">
                        No documents uploaded yet
                      </p>
                    ) : (
                      selectedApplication.documents.map(document => (
                        <div
                          key={document.id}
                          className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                            <span className="text-xs sm:text-sm text-gray-700 truncate">
                              {document.name}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handleDownloadDocument(document)}>
                            <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
