'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Calendar as CalendarIcon,
  Upload,
  X,
  ArrowLeft,
  FileText,
  Image,
  File,
  AlertCircle
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { TenantAPI } from '@/lib/api/tenant';
import { cn } from '@/lib/utils';

interface Property {
  id: string;
  name: string;
  type: string;
  unit_types: string[];
  monthly_rent: number;
  total_units: number;
  occupied_units: number;
  available_units: number;
}

interface AvailableUnit {
  unit_number: string;
}

export default function NewApplicationPage() {
  const router = useRouter();
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [formData, setFormData] = useState({
    propertyId: '',
    unitType: '',
    unitNumber: '',
    moveInDate: null as Date | null,
    message: ''
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    const fetchProperties = async () => {
      if (!authState.user?.id) return;

      try {
        setLoading(true);
        const result = await TenantAPI.getAvailableProperties();
        if (result.success && result.data) {
          // Convert PropertyListing[] to Property[]
          const propertiesWithUnitTypes = result.data.map(p => ({
            id: p.id,
            name: p.name,
            type: p.type,
            unit_types: [p.type], // For now, using property type as unit type
            monthly_rent: p.monthly_rent,
            total_units: p.total_units,
            occupied_units: p.occupied_units,
            available_units: p.total_units - p.occupied_units
          }));
          setProperties(propertiesWithUnitTypes);

          // Check for propertyId in URL query params
          const params = new URLSearchParams(window.location.search);
          const propertyId = params.get('propertyId');
          if (propertyId) {
            const selectedProp = propertiesWithUnitTypes.find(
              p => p.id === propertyId
            );
            if (selectedProp) {
              setSelectedProperty(selectedProp);
              setFormData(prev => ({
                ...prev,
                propertyId: selectedProp.id,
                unitType: selectedProp.unit_types[0] // Auto-select first unit type
              }));

              // Unit number will be manually entered by user
            }
          }
        } else {
          toast.error('Failed to load available properties');
        }
      } catch (error) {
        console.error('Failed to fetch properties:', error);
        toast.error('Failed to load available properties');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [authState.user?.id]);

  const handlePropertyChange = async (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    setSelectedProperty(property || null);
    setFormData(prev => ({
      ...prev,
      propertyId,
      unitType: '', // Reset unit type when property changes
      unitNumber: '' // Reset unit number when property changes
    }));
  };

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

  const validateForm = () => {
    if (
      !formData.propertyId ||
      !formData.unitType ||
      !formData.unitNumber ||
      !formData.moveInDate
    ) {
      toast.error('Please fill in all required fields');
      return false;
    }

    if (uploadedFiles.length === 0) {
      toast.error('Please upload at least one supporting document');
      return false;
    }

    // Ensure moveInDate is not null before submitting
    if (!formData.moveInDate) {
      toast.error('Please select a move-in date');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authState.user?.id) return;

    if (!validateForm()) return;

    // Show confirmation dialog instead of submitting directly
    setShowConfirmDialog(true);
  };

  const submitApplication = async () => {
    try {
      setSubmitting(true);
      if (!authState.user?.id) return;

      const result = await TenantAPI.submitApplication({
        userId: authState.user.id,
        propertyId: formData.propertyId,
        unitType: formData.unitType,
        unitNumber: formData.unitNumber,
        moveInDate: formData.moveInDate!,
        message: formData.message,
        documents: uploadedFiles
      });

      if (result.success) {
        toast.success('Application submitted successfully');
        router.push('/tenant/dashboard/applications');
      } else {
        toast.error(result.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Failed to submit application:', error);
      toast.error('Failed to submit application');
    } finally {
      setSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading available properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/tenant/dashboard/applications')}
          className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Application</h1>
          <p className="text-gray-600">Submit a new rental application</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
          <CardContent className="p-6">
            {/* Property Selection */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="property">Property</Label>
                <Select
                  value={formData.propertyId}
                  onValueChange={handlePropertyChange}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map(property => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProperty && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="unitType">Unit Type</Label>
                    <Select
                      value={formData.unitType}
                      onValueChange={value =>
                        setFormData(prev => ({ ...prev, unitType: value }))
                      }>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select unit type" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProperty.unit_types.map(type => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Monthly Rent</Label>
                    <p className="text-lg font-semibold text-gray-900">
                      ₱{selectedProperty.monthly_rent.toLocaleString()}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unitNumber">Unit Number *</Label>
                    <Input
                      id="unitNumber"
                      value={formData.unitNumber}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, unitNumber: e.target.value }))
                      }
                      placeholder="e.g., 201, A-1, Ground Floor, etc."
                      className="bg-white"
                    />
                    <p className="text-sm text-gray-500">
                      Enter the unit number you're interested in
                    </p>
                  </div>

                  {formData.unitNumber && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <h4 className="font-medium text-blue-900 mb-2">
                        Selected Unit Details
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-blue-700">Unit Number</p>
                          <p className="font-medium text-blue-900">
                            {formData.unitNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-blue-700">Type</p>
                          <p className="font-medium text-blue-900">
                            {formData.unitType}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-blue-700">Monthly Rent</p>
                          <p className="font-medium text-blue-900">
                            ₱{selectedProperty.monthly_rent.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-blue-700">Property</p>
                          <p className="font-medium text-blue-900">
                            {selectedProperty.name}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label>Preferred Move-in Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal bg-white',
                        !formData.moveInDate && 'text-gray-500'
                      )}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.moveInDate ? (
                        format(formData.moveInDate, 'PPP')
                      ) : (
                        <span>Select date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <div className="p-3 border-b border-gray-100">
                      <p className="text-sm text-gray-500">
                        Select a move-in date within the next 3 months
                      </p>
                    </div>
                    <Calendar
                      mode="single"
                      selected={formData.moveInDate || undefined}
                      onSelect={date =>
                        setFormData(prev => ({
                          ...prev,
                          moveInDate: date || null
                        }))
                      }
                      disabled={date => {
                        const today = new Date();
                        const threeMonthsFromNow = new Date();
                        threeMonthsFromNow.setMonth(
                          threeMonthsFromNow.getMonth() + 3
                        );
                        return date < today || date > threeMonthsFromNow;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, message: e.target.value }))
                  }
                  placeholder="Any additional information you'd like to share..."
                  className="bg-white resize-none"
                  rows={4}
                />
              </div>

              {/* Document Upload */}
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Supporting Documents
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">Valid Government ID</p>
                          <p className="text-sm text-blue-100">
                            Passport, Driver's License, or National ID
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">Proof of Income</p>
                          <p className="text-sm text-blue-100">
                            Latest 3 months of pay slips or bank statements
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">Employment Certificate</p>
                          <p className="text-sm text-blue-100">
                            Current employment verification letter
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">Character Reference</p>
                          <p className="text-sm text-blue-100">
                            Optional: Letter from previous landlord or employer
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    'relative rounded-lg transition-all duration-200',
                    uploadedFiles.length === 0
                      ? 'border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/50'
                      : 'border border-blue-100 bg-white'
                  )}
                  onDragOver={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.classList.add(
                      'border-blue-500',
                      'bg-blue-50'
                    );
                  }}
                  onDragLeave={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.classList.remove(
                      'border-blue-500',
                      'bg-blue-50'
                    );
                  }}
                  onDrop={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.classList.remove(
                      'border-blue-500',
                      'bg-blue-50'
                    );

                    const files = Array.from(e.dataTransfer.files).filter(
                      file => {
                        const isValid = file.size <= 10 * 1024 * 1024; // 10MB limit
                        if (!isValid) {
                          toast.error(`${file.name} is too large (max 10MB)`);
                        }
                        return isValid;
                      }
                    );

                    setUploadedFiles(prev => [...prev, ...files]);
                  }}>
                  {uploadedFiles.length === 0 ? (
                    <div className="p-8">
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        multiple
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleFileUpload}
                      />
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Upload className="w-8 h-8 text-blue-600" />
                        </div>
                        <h4 className="text-lg font-medium text-gray-900 mb-2">
                          Drop your files here
                        </h4>
                        <p className="text-sm text-gray-500 mb-4">
                          or{' '}
                          <button
                            type="button"
                            className="text-blue-600 hover:text-blue-700 font-medium"
                            onClick={() =>
                              document.getElementById('file-upload')?.click()
                            }>
                            browse from your computer
                          </button>
                        </p>
                        <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500">
                          <span className="px-2 py-1 bg-gray-100 rounded-full">
                            Images (JPG, PNG)
                          </span>
                          <span className="px-2 py-1 bg-gray-100 rounded-full">
                            PDF Documents
                          </span>
                          <span className="px-2 py-1 bg-gray-100 rounded-full">
                            Word Documents
                          </span>
                          <span className="px-2 py-1 bg-gray-100 rounded-full">
                            Max 10MB
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">
                          Uploaded Files
                        </h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-blue-200 text-blue-700 hover:bg-blue-50"
                          onClick={() =>
                            document.getElementById('file-upload')?.click()
                          }>
                          <Upload className="w-4 h-4 mr-2" />
                          Add More
                        </Button>
                      </div>
                      <div className="grid gap-3">
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors group">
                            <div className="h-12 w-12 flex items-center justify-center bg-white rounded-lg border border-gray-200 group-hover:border-blue-200 transition-colors">
                              {file.type.includes('image') ? (
                                <Image className="w-6 h-6 text-blue-600" />
                              ) : file.type.includes('pdf') ? (
                                <FileText className="w-6 h-6 text-blue-600" />
                              ) : (
                                <File className="w-6 h-6 text-blue-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                {file.name}
                              </p>
                              <div className="flex items-center gap-3 text-sm text-gray-500">
                                <span>
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span>
                                  {file.type.split('/')[1]?.toUpperCase() ||
                                    'Unknown type'}
                                </span>
                              </div>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => removeFile(index)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/tenant/dashboard/applications')}
            disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            disabled={submitting}>
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Submitting...
              </>
            ) : (
              'Submit Application'
            )}
          </Button>
        </div>
      </form>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Application Submission</DialogTitle>
            <DialogDescription>
              Please review your application details before submitting:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Property</p>
                <p className="font-medium">{selectedProperty?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unit Number</p>
                <p className="font-medium">{formData.unitNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Monthly Rent</p>
                <p className="font-medium">
                  ₱{selectedProperty?.monthly_rent.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Move-in Date</p>
                <p className="font-medium">
                  {formData.moveInDate
                    ? format(formData.moveInDate, 'PPP')
                    : 'Not selected'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Supporting Documents</p>
              <ul className="list-disc list-inside mt-1">
                {uploadedFiles.map((file, index) => (
                  <li key={index} className="text-sm">
                    {file.name}
                  </li>
                ))}
              </ul>
            </div>
            {formData.message && (
              <div>
                <p className="text-sm text-gray-500">Additional Message</p>
                <p className="text-sm mt-1">{formData.message}</p>
              </div>
            )}
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700">
                By submitting this application, you confirm that all provided
                information is accurate and complete. The property owner will
                review your application and respond within 2-3 business days.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={submitting}>
              Back to Edit
            </Button>
            <Button
              onClick={submitApplication}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              disabled={submitting}>
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Submitting...
                </>
              ) : (
                'Confirm & Submit'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
