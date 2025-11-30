'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import {
  Building,
  MapPin,
  Users,
  Edit,
  Trash2,
  ArrowLeft,
  Activity,
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  FileText,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Copy,
  MoreVertical,
  Image as ImageIcon,
  ZoomIn,
  Download,
  ExternalLink,
  Navigation,
  Home,
  Maximize2,
  X,
  PhilippinePeso,
  Info
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { PropertiesAPI, type PropertyAnalytics } from '@/lib/api/properties';
import {
  DocumentsAPI,
  PropertyDocument,
  DocumentRequirement
} from '@/lib/api/documents';
import { toast } from 'sonner';
import { DeletePropertyModal } from '@/components/properties/DeletePropertyModal';
import { Upload, Clock, XCircle } from 'lucide-react';

import { formatPropertyType } from '@/lib/utils';
interface Property {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  province: string;
  postal_code?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  total_units: number;
  occupied_units: number;
  monthly_rent: number;
  status: string;
  description?: string;
  amenities: string[];
  images?: string[];
  thumbnail?: string;
  floor_plan?: string;
  property_rules?: string;
  created_at: string;
  updated_at: string;
}

interface Tenant {
  id: string;
  user: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  unit_number: string;
  lease_start: string;
  lease_end: string;
  monthly_rent: number;
  status: string;
}

export default function PropertyDetailsPage() {
  const { authState } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [analytics, setAnalytics] = useState<PropertyAnalytics | null>(null);
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  const [documentRequirements, setDocumentRequirements] = useState<
    DocumentRequirement[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [showUploadFor, setShowUploadFor] = useState<string | null>(null);

  // Mapbox ref
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  // Set active tab from URL parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (
      tab &&
      ['overview', 'tenants', 'documents', 'analytics', 'details'].includes(tab)
    ) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const loadPropertyData = async () => {
      if (!propertyId) return;

      try {
        setIsLoading(true);

        // Load property details, tenants, analytics, and documents in parallel
        const [
          propertyResult,
          tenantsResult,
          analyticsResult,
          docsResult,
          reqResult
        ] = await Promise.all([
          PropertiesAPI.getProperty(propertyId),
          PropertiesAPI.getPropertyTenants(propertyId),
          PropertiesAPI.getPropertyAnalytics(propertyId),
          DocumentsAPI.getPropertyDocuments(propertyId),
          DocumentsAPI.getDocumentRequirements()
        ]);

        if (propertyResult.success) {
          setProperty(propertyResult.data);
        } else {
          toast.error('Failed to load property details');
        }

        if (tenantsResult.success) {
          setTenants(tenantsResult.data);
        }

        if (analyticsResult.success && analyticsResult.data) {
          setAnalytics(analyticsResult.data);
        }

        if (docsResult.success) {
          setDocuments(docsResult.data);
        }

        if (reqResult.success) {
          setDocumentRequirements(
            reqResult.data.filter(req => req.is_required)
          );
        }
      } catch (error) {
        console.error('Failed to load property data:', error);
        toast.error('Failed to load property data');
      } finally {
        setIsLoading(false);
      }
    };

    loadPropertyData();
  }, [propertyId]);

  // Initialize Mapbox when property is loaded
  useEffect(() => {
    if (!property?.coordinates || !mapContainerRef.current) return;

    const loadMapbox = async () => {
      // Add Mapbox CSS
      if (!document.getElementById('mapbox-css')) {
        const link = document.createElement('link');
        link.id = 'mapbox-css';
        link.rel = 'stylesheet';
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
        document.head.appendChild(link);
      }

      // Load Mapbox GL JS
      if (!(window as any).mapboxgl) {
        const script = document.createElement('script');
        script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
        script.async = true;
        document.body.appendChild(script);

        await new Promise(resolve => {
          script.onload = resolve;
        });
      }

      const mapboxgl = (window as any).mapboxgl;
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

      // Initialize map
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [property.coordinates.lng, property.coordinates.lat],
        zoom: 15
      });

      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add marker at property location
      new mapboxgl.Marker({ color: '#3B82F6' })
        .setLngLat([property.coordinates.lng, property.coordinates.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<strong>${property.name}</strong><br/>${property.address}`
          )
        )
        .addTo(map);

      mapRef.current = map;
    };

    loadMapbox();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [property]);

  const handleEdit = () => {
    router.push(`/owner/dashboard/properties/${propertyId}/edit`);
  };

  const handleDeleteClick = () => {
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!property) return;

    try {
      setIsDeleting(true);
      const result = await PropertiesAPI.deleteProperty(propertyId);

      if (result.success) {
        toast.success('Property deleted successfully');
        router.push('/owner/dashboard/properties');
      } else {
        toast.error(result.message || 'Failed to delete property');
      }
    } catch (error) {
      console.error('Delete property error:', error);
      toast.error('Failed to delete property');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
  };

  const handleFileUpload = async (documentType: string, file: File) => {
    try {
      const requirement = documentRequirements.find(
        req => req.document_type === documentType
      );

      if (!requirement) {
        toast.error('Invalid document type');
        return;
      }

      // Validate file size
      if (file.size > requirement.max_file_size) {
        toast.error(
          `File size exceeds ${(
            requirement.max_file_size /
            1024 /
            1024
          ).toFixed(0)}MB limit`
        );
        return;
      }

      // Validate file type
      if (!requirement.allowed_mime_types.includes(file.type)) {
        toast.error('Invalid file type. Only PDF, JPG, and PNG are allowed');
        return;
      }

      setUploadingDocType(documentType);

      const result = await DocumentsAPI.uploadPropertyDocument(
        propertyId,
        documentType,
        file
      );

      if (result.success) {
        toast.success(result.message || 'Document uploaded successfully');
        setShowUploadFor(null);
        // Reload documents
        const docsResult = await DocumentsAPI.getPropertyDocuments(propertyId);
        if (docsResult.success) {
          setDocuments(docsResult.data);
        }
      } else {
        toast.error(result.message || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploadingDocType(null);
    }
  };

  const handleDuplicate = async () => {
    const newName = prompt(
      `Enter name for the duplicated property:`,
      `${property?.name} - Copy`
    );
    if (!newName) return;

    try {
      const result = await PropertiesAPI.duplicateProperty(propertyId, newName);
      if (result.success) {
        toast.success('Property duplicated successfully');
        router.push('/owner/dashboard/properties');
      } else {
        toast.error(result.message || 'Failed to duplicate property');
      }
    } catch (error) {
      console.error('Duplicate property error:', error);
      toast.error('Failed to duplicate property');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-700 border-0">Active</Badge>
        );
      case 'inactive':
        return (
          <Badge className="bg-gray-100 text-gray-700 border-0">Inactive</Badge>
        );
      case 'maintenance':
        return (
          <Badge className="bg-orange-100 text-orange-700 border-0">
            Maintenance
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-100 text-blue-700 border-0">{status}</Badge>
        );
    }
  };

  const getTenantStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-700 border-0">Active</Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-0">
            Pending
          </Badge>
        );
      case 'terminated':
        return (
          <Badge className="bg-red-100 text-red-700 border-0">Terminated</Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 border-0">{status}</Badge>
        );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getOccupancyRate = () => {
    if (!property) return 0;
    return property.total_units > 0
      ? (property.occupied_units / property.total_units) * 100
      : 0;
  };

  const openLightbox = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    setIsLightboxOpen(false);
  };

  const openGoogleMaps = () => {
    if (property?.coordinates) {
      const { lat, lng } = property.coordinates;
      const url = `https://www.google.com/maps?q=${lat},${lng}`;
      window.open(url, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium text-sm sm:text-base">
            Loading property details...
          </p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Building className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
            Property not found
          </h3>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            The property you're looking for doesn't exist or has been removed.
          </p>
          <Button
            onClick={() => router.push('/owner/dashboard/properties')}
            className="text-sm sm:text-base">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Properties
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-white to-blue-50/50 shadow-sm border-b border-blue-100">
        <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-blue-600 hover:bg-blue-50 text-sm sm:text-base">
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-1">
                  <Badge className="bg-blue-600 text-white font-mono text-xs sm:text-sm px-2 sm:px-3 py-1">
                    {property.property_code}
                  </Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
                  {property.name}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                    <p className="text-blue-600/80 font-medium text-xs sm:text-base">
                      {property.address}, {property.city}, {property.province}
                    </p>
                  </div>
                  {getStatusBadge(property.status)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleEdit}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm sm:text-base">
                <Edit className="w-4 h-4 mr-2" />
                Edit Property
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-200 text-blue-600">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDuplicate}>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate Property
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDeleteClick}
                    className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Property
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Building className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {property.total_units}
                    </p>
                    <p className="text-sm text-gray-600">Total Units</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {property.occupied_units}
                    </p>
                    <p className="text-sm text-gray-600">Occupied Units</p>
                    <div className="flex items-center mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                      <span className="text-xs text-green-600">
                        {Math.round(getOccupancyRate())}% occupancy
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <PhilippinePeso className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(property.monthly_rent)}
                    </p>
                    <p className="text-sm text-gray-600">Monthly Rent</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(analytics?.totalRevenue || 0)}
                    </p>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Information */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm border border-blue-100">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="tenants"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Tenants ({tenants.length})
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Documents ({documents.length})
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Analytics
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Details
              </TabsTrigger>
              <TabsTrigger
                value="rooms"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                <Building className="w-4 h-4 mr-2" />
                Rooms
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="space-y-6">
                {/* Property Images Gallery */}
                {property.images && property.images.length > 0 && (
                  <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-blue-600" />
                        Property Images
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {property.images.map((imageUrl, index) => (
                          <div
                            key={index}
                            className="relative group cursor-pointer rounded-lg overflow-hidden bg-gray-100"
                            onClick={() => openLightbox(imageUrl)}>
                            <img
                              src={imageUrl}
                              alt={`${property.name} - Image ${index + 1}`}
                              className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                              <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Unit Statistics */}
                <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      Unit Availability
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg text-center">
                        <p className="text-sm text-gray-600 mb-1">
                          Total Units
                        </p>
                        <p className="text-3xl font-bold text-blue-700">
                          {property.total_units}
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg text-center">
                        <p className="text-sm text-gray-600 mb-1">Occupied</p>
                        <p className="text-3xl font-bold text-green-700">
                          {property.occupied_units}
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg text-center">
                        <p className="text-sm text-gray-600 mb-1">Available</p>
                        <p className="text-3xl font-bold text-purple-700">
                          {property.total_units - property.occupied_units}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">Occupancy Rate</p>
                        <span className="font-bold text-lg">
                          {getOccupancyRate()}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all"
                          style={{ width: `${getOccupancyRate()}%` }}
                        />
                      </div>
                    </div>

                    {/* Unit Details List */}
                    <div className="mt-6 border-t pt-4">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Unit Details
                      </h4>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {tenants.length > 0 ? (
                          // Show occupied units with tenant info
                          tenants.map(tenant => (
                            <div
                              key={tenant.id}
                              className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                  {tenant.unit_number}
                                </div>
                                <div>
                                  <p className="font-semibold text-sm">
                                    {tenant.user.first_name}{' '}
                                    {tenant.user.last_name}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    Unit {tenant.unit_number} • Occupied
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                                  Occupied
                                </Badge>
                                <p className="text-xs text-gray-600 mt-1">
                                  ₱{tenant.monthly_rent.toLocaleString()}/mo
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">
                            No tenant data available
                          </p>
                        )}

                        {/* Show available units */}
                        {Array.from(
                          {
                            length:
                              property.total_units - property.occupied_units
                          },
                          (_, i) => (
                            <div
                              key={`available-${i}`}
                              className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                  {property.occupied_units + i + 1}
                                </div>
                                <div>
                                  <p className="font-semibold text-sm">
                                    Available Unit
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    Unit {property.occupied_units + i + 1} •
                                    Ready to rent
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">
                                  Available
                                </Badge>
                                <p className="text-xs text-gray-600 mt-1">
                                  ₱{property.monthly_rent.toLocaleString()}/mo
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Property Information */}
                  <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Home className="w-5 h-5 text-blue-600" />
                        Property Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Type</p>
                          <p className="font-semibold capitalize">
                            {formatPropertyType(property.type)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          {getStatusBadge(property.status)}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">City</p>
                          <p className="font-semibold">{property.city}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Province</p>
                          <p className="font-semibold">{property.province}</p>
                        </div>
                        {property.postal_code && (
                          <div className="col-span-2">
                            <p className="text-sm text-gray-600">Postal Code</p>
                            <p className="font-semibold">
                              {property.postal_code}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="border-t pt-4">
                        <p className="text-sm text-gray-600">Full Address</p>
                        <p className="font-semibold">{property.address}</p>
                        <p className="text-sm text-gray-500">
                          {property.city}, {property.province}{' '}
                          {property.postal_code}
                        </p>
                      </div>

                      {property.description && (
                        <div className="border-t pt-4">
                          <p className="text-sm text-gray-600 mb-2">
                            Description
                          </p>
                          <p className="text-gray-900 leading-relaxed">
                            {property.description}
                          </p>
                        </div>
                      )}

                      {/* Property Location Map */}
                      {property.coordinates && (
                        <div className="border-t pt-4">
                          <div className="mb-3">
                            <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-blue-600" />
                              Property Location
                            </p>
                            <p className="text-xs font-mono text-gray-500">
                              {property.coordinates.lat.toFixed(6)},{' '}
                              {property.coordinates.lng.toFixed(6)}
                            </p>
                          </div>

                          {/* Mapbox Container */}
                          <div
                            ref={mapContainerRef}
                            className="w-full h-[250px] rounded-lg border-2 border-blue-200 overflow-hidden mb-3"
                          />

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={openGoogleMaps}
                            className="w-full text-blue-600 border-blue-200 hover:bg-blue-50">
                            <Navigation className="w-4 h-4 mr-2" />
                            Open in Google Maps
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Amenities */}
                  <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
                    <CardHeader>
                      <CardTitle>Amenities & Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {property.amenities.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {property.amenities.map((amenity, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="bg-blue-100 text-blue-700 px-3 py-1">
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No amenities listed</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Floor Plan */}
                {property.floor_plan && (
                  <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Floor Plan
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-center">
                        <div
                          className="relative group cursor-pointer rounded-lg overflow-hidden bg-gray-100 max-w-2xl"
                          onClick={() => openLightbox(property.floor_plan!)}>
                          <img
                            src={property.floor_plan}
                            alt={`${property.name} - Floor Plan`}
                            className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                            <div className="flex items-center gap-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <Maximize2 className="w-6 h-6" />
                              <span className="font-medium">
                                Click to enlarge
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="tenants" className="mt-6">
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
                <CardHeader>
                  <CardTitle>Current Tenants</CardTitle>
                </CardHeader>
                <CardContent>
                  {tenants.length > 0 ? (
                    <div className="space-y-4">
                      {tenants.map(tenant => (
                        <div
                          key={tenant.id}
                          className="flex items-center justify-between p-4 border border-blue-100 rounded-lg bg-blue-50/50">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                              {tenant.user.first_name[0]}
                              {tenant.user.last_name[0]}
                            </div>
                            <div>
                              <p className="font-semibold">
                                {tenant.user.first_name} {tenant.user.last_name}
                              </p>
                              <p className="text-sm text-gray-600">
                                Unit {tenant.unit_number}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                <Mail className="w-3 h-3" />
                                {tenant.user.email}
                                <Phone className="w-3 h-3 ml-2" />
                                {tenant.user.phone}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {getTenantStatusBadge(tenant.status)}
                            <p className="text-sm font-semibold mt-1">
                              {formatCurrency(tenant.monthly_rent)}/month
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(tenant.lease_start)} -{' '}
                              {formatDate(tenant.lease_end)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No tenants currently</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-6">
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Submitted Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {documents.length > 0 ? (
                    <div className="space-y-4">
                      {documentRequirements.map(requirement => {
                        const doc = documents.find(
                          d => d.document_type === requirement.document_type
                        );

                        return (
                          <div
                            key={requirement.id}
                            className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 flex-1">
                                <FileText className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-gray-900">
                                      {requirement.display_name}
                                    </h4>
                                    {doc ? (
                                      doc.status === 'approved' ? (
                                        <Badge className="bg-green-100 text-green-700 border-green-200">
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          Approved
                                        </Badge>
                                      ) : doc.status === 'rejected' ? (
                                        <Badge className="bg-red-100 text-red-700 border-red-200">
                                          <XCircle className="w-3 h-3 mr-1" />
                                          Rejected
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                                          <Clock className="w-3 h-3 mr-1" />
                                          Pending Review
                                        </Badge>
                                      )
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="bg-gray-100 text-gray-700">
                                        <Upload className="w-3 h-3 mr-1" />
                                        Not Uploaded
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">
                                    {requirement.description}
                                  </p>

                                  {doc && (
                                    <>
                                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                        <span className="font-medium">
                                          {doc.document_name}
                                        </span>
                                        <span>•</span>
                                        <span>
                                          {(
                                            doc.file_size /
                                            1024 /
                                            1024
                                          ).toFixed(2)}{' '}
                                          MB
                                        </span>
                                        <span>•</span>
                                        <span>
                                          Uploaded{' '}
                                          {new Date(
                                            doc.uploaded_at
                                          ).toLocaleDateString()}
                                        </span>
                                      </div>

                                      {doc.status === 'rejected' &&
                                        doc.rejection_reason && (
                                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                                            <p className="text-sm font-medium text-red-800 mb-1">
                                              Rejection Reason:
                                            </p>
                                            <p className="text-sm text-red-700">
                                              {doc.rejection_reason}
                                            </p>
                                            <p className="text-xs text-red-600 mt-2">
                                              📤 Please upload a new version to
                                              address these issues.
                                            </p>
                                          </div>
                                        )}
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col gap-2">
                                {doc && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                    onClick={() =>
                                      window.open(doc.file_url, '_blank')
                                    }>
                                    <Download className="w-4 h-4 mr-1" />
                                    View
                                  </Button>
                                )}
                                {(!doc || doc.status === 'rejected') && (
                                  <Button
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={() =>
                                      setShowUploadFor(
                                        showUploadFor ===
                                          requirement.document_type
                                          ? null
                                          : requirement.document_type
                                      )
                                    }>
                                    <Upload className="w-4 h-4 mr-1" />
                                    {doc
                                      ? 'Upload New Version'
                                      : 'Upload Document'}
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Inline Upload Area */}
                            {showUploadFor === requirement.document_type && (
                              <div className="mt-4 p-4 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
                                <label
                                  htmlFor={`file-upload-${requirement.document_type}`}
                                  className="block cursor-pointer">
                                  <div className="text-center py-6">
                                    <Upload className="w-12 h-12 mx-auto text-blue-600 mb-3" />
                                    <p className="text-sm font-medium text-blue-900 mb-1">
                                      {uploadingDocType ===
                                      requirement.document_type
                                        ? 'Uploading...'
                                        : 'Click to upload or drag and drop'}
                                    </p>
                                    <p className="text-xs text-blue-700">
                                      PDF, JPG, PNG (Max{' '}
                                      {(
                                        requirement.max_file_size /
                                        1024 /
                                        1024
                                      ).toFixed(0)}
                                      MB)
                                    </p>
                                    {doc?.status === 'rejected' && (
                                      <p className="text-xs text-blue-800 mt-2 font-medium">
                                        📤 Uploading a new version will keep the
                                        previous document for reference
                                      </p>
                                    )}
                                  </div>
                                </label>
                                <input
                                  id={`file-upload-${requirement.document_type}`}
                                  type="file"
                                  className="hidden"
                                  accept={requirement.allowed_mime_types.join(
                                    ','
                                  )}
                                  onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleFileUpload(
                                        requirement.document_type,
                                        file
                                      );
                                    }
                                  }}
                                  disabled={
                                    uploadingDocType ===
                                    requirement.document_type
                                  }
                                />
                                <div className="mt-3 flex justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowUploadFor(null)}
                                    disabled={
                                      uploadingDocType ===
                                      requirement.document_type
                                    }>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Manage Documents Button */}
                      {/* <div className="mt-4">
                        <Button
                          onClick={() =>
                            router.push(
                              `/owner/dashboard/properties/${propertyId}/documents`
                            )
                          }
                          className="w-full bg-blue-600 hover:bg-blue-700">
                          <FileText className="w-4 h-4 mr-2" />
                          Manage All Documents
                        </Button>
                      </div> */}

                      {/* Document Status Summary */}
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-2">
                          Document Status Summary
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Total</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {documents.length}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Approved</p>
                            <p className="text-2xl font-bold text-green-600">
                              {
                                documents.filter(d => d.status === 'approved')
                                  .length
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Pending</p>
                            <p className="text-2xl font-bold text-yellow-600">
                              {
                                documents.filter(d => d.status === 'pending')
                                  .length
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Rejected</p>
                            <p className="text-2xl font-bold text-red-600">
                              {
                                documents.filter(d => d.status === 'rejected')
                                  .length
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">
                        No documents uploaded yet
                      </p>
                      <Button
                        onClick={() =>
                          router.push(
                            `/owner/dashboard/properties/${propertyId}/documents`
                          )
                        }
                        className="bg-blue-600 hover:bg-blue-700">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Documents
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
                  <CardHeader>
                    <CardTitle>Financial Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(analytics?.totalRevenue || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          Maintenance Costs
                        </p>
                        <p className="text-2xl font-bold text-red-600">
                          {formatCurrency(analytics?.maintenanceCosts || 0)}
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-600">Net Revenue</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {formatCurrency(
                          (analytics?.totalRevenue || 0) -
                            (analytics?.maintenanceCosts || 0)
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics?.recentActivity &&
                    analytics.recentActivity.length > 0 ? (
                      <div className="space-y-3">
                        {analytics.recentActivity.map((activity, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-lg">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                activity.type === 'maintenance'
                                  ? 'bg-orange-500'
                                  : 'bg-green-500'
                              }`}>
                              {activity.type === 'maintenance' ? (
                                <Wrench className="w-4 h-4 text-white" />
                              ) : (
                                <PhilippinePeso className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {activity.description}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(activity.date)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No recent activity</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="details" className="mt-6">
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
                <CardHeader>
                  <CardTitle>Property Rules & Guidelines</CardTitle>
                </CardHeader>
                <CardContent>
                  {property.property_rules ? (
                    <div className="whitespace-pre-wrap text-gray-900">
                      {property.property_rules}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No property rules defined</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Rooms Tab Content */}
            <TabsContent value="rooms" className="mt-6">
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-600" />
                    Room Availability
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Summary Stats */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-semibold">Total Units:</span>{' '}
                        {property.total_units}
                      </p>
                      <p className="text-xs text-gray-500">
                        🟢 Green = Available | ⚫ Gray = Occupied
                      </p>
                    </div>

                    {/* Room Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {Array.from({ length: property.total_units }).map(
                        (_, index) => {
                          const unitNumber = `Unit ${index + 1}`;
                          const isOccupied = tenants.some(
                            t => t.unit_number === unitNumber
                          );

                          return (
                            <div
                              key={unitNumber}
                              className={`
                              p-3 rounded-lg border-2 text-center transition-all
                              ${
                                isOccupied
                                  ? 'bg-gray-100 border-gray-300 opacity-60'
                                  : 'bg-green-50 border-green-300 hover:border-green-400'
                              }
                            `}>
                              <p className="font-semibold text-sm text-gray-900">
                                {unitNumber.replace('Unit', 'Room')}
                              </p>
                              <p
                                className={`text-xs mt-1 font-medium ${
                                  isOccupied
                                    ? 'text-gray-600'
                                    : 'text-green-600'
                                }`}>
                                {isOccupied ? '⚫ Occupied' : '🟢 Available'}
                              </p>
                            </div>
                          );
                        }
                      )}
                    </div>

                    {/* Occupied Units Details */}
                    {tenants.length > 0 && (
                      <div className="mt-6 pt-6 border-t">
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Occupied Rooms ({tenants.length})
                        </h4>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {tenants.map(tenant => (
                            <div
                              key={tenant.id}
                              className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                              <div className="flex-1">
                                <p className="font-semibold text-sm text-gray-900">
                                  {tenant.unit_number.replace('Unit', 'Room')}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {tenant.user.first_name}{' '}
                                  {tenant.user.last_name}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {tenant.user.email}
                                </p>
                              </div>
                              <Badge className="bg-blue-600 text-white text-xs whitespace-nowrap ml-2">
                                {tenant.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {tenants.length === 0 && (
                      <div className="mt-6 pt-6 border-t text-center">
                        <p className="text-sm text-gray-600">
                          ✨ All {property.total_units} rooms are available!
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Image Lightbox */}
      {isLightboxOpen && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 bg-white/10 backdrop-blur-sm rounded-full p-2 text-white hover:bg-white/20 transition-colors">
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedImage}
              alt="Property Image"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <div className="absolute bottom-4 left-4 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
              <p className="text-white text-sm">{property?.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeletePropertyModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        propertyName={property?.name || ''}
        isDeleting={isDeleting}
      />
    </div>
  );
}
