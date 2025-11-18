'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import {
  Building,
  MapPin,
  Users,
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  FileText,
  CheckCircle,
  AlertTriangle,
  Image as ImageIcon,
  ZoomIn,
  Download,
  ExternalLink,
  Navigation,
  Home,
  Maximize2,
  X,
  PhilippinePeso,
  Star,
  Heart,
  MessageSquare,
  Eye,
  Wifi,
  Car,
  Shield,
  Waves,
  BedDouble
} from 'lucide-react';
import { TenantAPI, type PropertyListing } from '@/lib/api/tenant';
import { DocumentsAPI, type PropertyDocument } from '@/lib/api/documents';
import { cn, formatPropertyType } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function TenantPropertyDetailsPage() {
  const { authState } = useAuth();
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<PropertyListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [hasPendingApplication, setHasPendingApplication] = useState(false);
  const [hasApprovedApplication, setHasApprovedApplication] = useState(false);
  const [propertyDocuments, setPropertyDocuments] = useState<PropertyDocument[]>([]);

  useEffect(() => {
    const loadPropertyData = async () => {
      if (!propertyId || !authState.user?.id) return;

      try {
        setIsLoading(true);

        // Load property details
        const propertyResult = await TenantAPI.getProperty(propertyId);

        if (propertyResult.success && propertyResult.data) {
          setProperty(propertyResult.data);
        } else {
          toast.error('Failed to load property details');
          router.push('/tenant/dashboard/properties');
          return;
        }

        // Check if user has pending application for this property
        const hasPending = await TenantAPI.hasPendingApplication(
          authState.user.id,
          propertyId
        );
        setHasPendingApplication(hasPending);

        // Check if user has approved application (is currently renting)
        const { data: approvedApp } = await supabase
          .from('rental_applications')
          .select('id')
          .eq('user_id', authState.user.id)
          .eq('property_id', propertyId)
          .eq('status', 'approved')
          .maybeSingle();
        
        setHasApprovedApplication(!!approvedApp);

        // Load property documents
        const docsResult = await DocumentsAPI.getPropertyDocuments(propertyId);
        if (docsResult.success && docsResult.data) {
          // Only show approved documents to tenants
          const approvedDocs = docsResult.data.filter(doc => doc.status === 'approved');
          setPropertyDocuments(approvedDocs);
        }
      } catch (error) {
        console.error('Failed to load property data:', error);
        toast.error('Failed to load property data');
        router.push('/tenant/dashboard/properties');
      } finally {
        setIsLoading(false);
      }
    };

    loadPropertyData();
  }, [propertyId, authState.user?.id, router]);

  const handleApplyToProperty = async () => {
    if (!authState.user?.id || !property) return;

    if (hasApprovedApplication) {
      toast.info('You are currently renting this property. View your rental details in Applications.');
      router.push('/tenant/dashboard/applications');
      return;
    }

    if (hasPendingApplication) {
      toast.error(
        "You already have a pending application for this property. Please wait for the owner's response or check your applications page."
      );
      return;
    }

    router.push(`/tenant/dashboard/applications/new?propertyId=${property.id}`);
  };

  const handleToggleFavorite = () => {
    setIsFavorited(prev => !prev);
    toast.success(
      isFavorited ? 'Removed from favorites' : 'Added to favorites'
    );
  };

  const handleContactOwner = () => {
    if (!property) return;
    router.push(`/tenant/dashboard/messages?owner=${property.owner_id}`);
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

  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('wifi') || amenityLower.includes('internet'))
      return Wifi;
    if (amenityLower.includes('parking') || amenityLower.includes('garage'))
      return Car;
    if (amenityLower.includes('security') || amenityLower.includes('cctv'))
      return Shield;
    if (amenityLower.includes('pool') || amenityLower.includes('swimming'))
      return Waves;
    if (amenityLower.includes('bed') || amenityLower.includes('room'))
      return BedDouble;
    return CheckCircle;
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
            onClick={() => router.push('/tenant/dashboard/properties')}
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
                Back
              </Button>
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-1">
                  <Badge className="bg-blue-600 text-white font-mono text-xs sm:text-sm px-2 sm:px-3 py-1">
                    {property.property_code}

                    {
                      console.log({property})
                    }
                  </Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
                  {property.name}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                    <p className="text-blue-600/80 font-medium text-xs sm:text-base">
                      {property.address}, {property.city}
                    </p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                    {formatPropertyType(property.type)}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleFavorite}
                className={cn(
                  'border-blue-200 text-blue-600 text-sm sm:text-base',
                  isFavorited && 'bg-red-50 border-red-200 text-red-600'
                )}>
                <Heart
                  className={cn('w-4 h-4 mr-2', isFavorited && 'fill-current')}
                />
                {isFavorited ? 'Favorited' : 'Add to Favorites'}
              </Button>
              <Button
                onClick={handleContactOwner}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm sm:text-base">
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact Owner
              </Button>
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
                      {property.available_units}
                    </p>
                    <p className="text-sm text-gray-600">Available Units</p>
                    <div className="flex items-center mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                      <span className="text-xs text-green-600">
                        {property.available_units > 0
                          ? 'Available'
                          : 'Fully Occupied'}
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
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {property.rating?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-sm text-gray-600">Rating</p>
                    <p className="text-xs text-gray-500">
                      ({property.reviewCount || 0} reviews)
                    </p>
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
            <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-blue-100">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs sm:text-sm">
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="amenities"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs sm:text-sm">
                Amenities
              </TabsTrigger>
              <TabsTrigger
                value="location"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs sm:text-sm">
                Location
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs sm:text-sm">
                Documents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="space-y-6">
                {/* Property Images Gallery */}
                {property.images && property.images.length > 0 && (
                  <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
                    <CardHeader className="p-3 sm:p-6">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        Property Images
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                        {property.images.map((imageUrl, index) => (
                          <div
                            key={index}
                            className="relative group cursor-pointer rounded-lg overflow-hidden bg-gray-100"
                            onClick={() => openLightbox(imageUrl)}>
                            <img
                              src={imageUrl}
                              alt={`${property.name} - Image ${index + 1}`}
                              className="w-full h-24 sm:h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                              <ZoomIn className="w-4 h-4 sm:w-6 sm:h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Property Information */}
                  <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
                    <CardHeader className="p-3 sm:p-6">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Home className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        Property Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0 space-y-4">
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Type
                          </p>
                          <p className="font-semibold text-sm sm:text-base">
                            {formatPropertyType(property.type)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Status
                          </p>
                          <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                            Available
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">
                            City
                          </p>
                          <p className="font-semibold text-sm sm:text-base">
                            {property.city}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Units
                          </p>
                          <p className="font-semibold text-sm sm:text-base">
                            {property.total_units}
                          </p>
                        </div>
                      </div>

                      <div className="border-t pt-3 sm:pt-4">
                        <p className="text-xs sm:text-sm text-gray-600">
                          Full Address
                        </p>
                        <p className="font-semibold text-sm sm:text-base">
                          {property.address}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {property.city}
                        </p>
                      </div>

                      {property.description && (
                        <div className="border-t pt-3 sm:pt-4">
                          <p className="text-xs sm:text-sm text-gray-600 mb-2">
                            Description
                          </p>
                          <p className="text-gray-900 leading-relaxed text-sm sm:text-base">
                            {property.description}
                          </p>
                        </div>
                      )}

                      {/* GPS Coordinates */}
                      {property.coordinates && (
                        <div className="border-t pt-3 sm:pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs sm:text-sm text-gray-600 mb-1">
                                GPS Coordinates
                              </p>
                              <p className="text-xs sm:text-sm font-mono text-gray-700">
                                {property.coordinates.lat.toFixed(6)},{' '}
                                {property.coordinates.lng.toFixed(6)}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={openGoogleMaps}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs sm:text-sm">
                              <Navigation className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                              View Map
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Owner Information */}
                  <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
                    <CardHeader className="p-3 sm:p-6">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        Property Owner
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0">
                      <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-blue-50/50 rounded-lg">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                          {property.owner_name
                            .split(' ')
                            .map(n => n[0])
                            .join('')}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm sm:text-base">
                            {property.owner_name}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Property Owner
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <Mail className="w-3 h-3" />
                            {property.owner_email}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button
                          onClick={handleContactOwner}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs sm:text-sm">
                          <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                          Send Message
                        </Button>
                        <Button
                          variant="outline"
                          className="border-blue-200 text-blue-600 hover:bg-blue-50 text-xs sm:text-sm">
                          <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Floor Plan */}
                {property.floor_plan && (
                  <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
                    <CardHeader className="p-3 sm:p-6">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        Floor Plan
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0">
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
                              <Maximize2 className="w-4 h-4 sm:w-6 sm:h-6" />
                              <span className="font-medium text-sm sm:text-base">
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

            <TabsContent value="amenities" className="mt-6">
              <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">
                    Amenities & Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  {property.amenities.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {property.amenities.map((amenity, index) => {
                        const IconComponent = getAmenityIcon(amenity);
                        return (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                            <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                            <span className="text-sm sm:text-base font-medium text-gray-900">
                              {amenity}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-sm sm:text-base">
                        No amenities listed
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="location" className="mt-6">
              <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    Location Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                      <h3 className="font-semibold text-sm sm:text-base mb-2">
                        Full Address
                      </h3>
                      <p className="text-gray-900 text-sm sm:text-base">
                        {property.address}
                      </p>
                      <p className="text-gray-600 text-xs sm:text-sm mt-1">
                        {property.city}
                      </p>
                    </div>

                    {property.coordinates && (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 className="font-semibold text-sm sm:text-base mb-2">
                          GPS Coordinates
                        </h3>
                        <p className="text-gray-700 text-xs sm:text-sm font-mono">
                          Latitude: {property.coordinates.lat.toFixed(6)}
                        </p>
                        <p className="text-gray-700 text-xs sm:text-sm font-mono">
                          Longitude: {property.coordinates.lng.toFixed(6)}
                        </p>
                        <Button
                          onClick={openGoogleMaps}
                          className="mt-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs sm:text-sm">
                          <Navigation className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                          Open in Google Maps
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-6">
              <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    Property Documents
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-gray-600 mt-2">
                    Official documents for this property verified by the owner
                  </p>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  {propertyDocuments.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {propertyDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between gap-3 sm:gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                    {doc.document_name}
                                  </h4>
                                  <Badge className="bg-green-100 text-green-700 border-0 text-xs flex-shrink-0">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Verified
                                  </Badge>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600 mb-2">
                                  {doc.document_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>
                                    {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                                  </span>
                                  <span>•</span>
                                  <span>
                                    Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-200 text-blue-700 hover:bg-blue-50 flex-shrink-0 text-xs sm:text-sm"
                              onClick={() => window.open(doc.file_url, '_blank')}>
                              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      <div className="mt-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-green-800">
                              All Documents Verified
                            </p>
                            <p className="text-xs text-green-700 mt-1">
                              These documents have been reviewed and approved by the property owner and admin.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-12">
                      <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">
                        No Documents Available
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        The property owner hasn't uploaded any documents yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Application Section */}
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg mt-6">
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    Ready to Apply?
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    {hasApprovedApplication
                      ? 'You are currently renting a unit at this property.'
                      : hasPendingApplication
                      ? 'Your application is currently being reviewed by the property owner.'
                      : property.available_units > 0
                      ? 'This property has available units. Start your application today!'
                      : 'This property is currently fully occupied.'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleApplyToProperty}
                    disabled={
                      property.available_units === 0 || hasPendingApplication
                    }
                    className={cn(
                      'text-sm sm:text-base',
                      hasApprovedApplication
                        ? 'bg-green-600 hover:bg-green-700'
                        : hasPendingApplication
                        ? 'bg-yellow-500 hover:bg-yellow-600'
                        : property.available_units > 0
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                        : 'bg-gray-400'
                    )}>
                    {hasApprovedApplication
                      ? 'Currently Renting'
                      : hasPendingApplication
                      ? 'Application Pending'
                      : property.available_units > 0
                      ? 'Apply Now'
                      : 'Fully Occupied'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/tenant/dashboard/properties')}
                    className="border-blue-200 text-blue-600 hover:bg-blue-50 text-sm sm:text-base">
                    <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Back to Search
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image Lightbox */}
      {isLightboxOpen && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 bg-white/10 backdrop-blur-sm rounded-full p-2 text-white hover:bg-white/20 transition-colors">
              <X className="w-4 h-4 sm:w-6 sm:h-6" />
            </button>
            <img
              src={selectedImage}
              alt="Property Image"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <div className="absolute bottom-4 left-4 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
              <p className="text-white text-xs sm:text-sm">{property?.name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
