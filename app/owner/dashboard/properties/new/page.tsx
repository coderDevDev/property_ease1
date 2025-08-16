'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import {
  Building,
  MapPin,
  DollarSign,
  Users,
  FileText,
  Plus,
  X,
  ArrowLeft,
  Save,
  AlertCircle,
  Camera,
  Image as ImageIcon,
  FileImage
} from 'lucide-react';
import { PropertiesAPI, type PropertyFormData } from '@/lib/api/properties';
import { ImageUpload } from '@/components/ui/image-upload';
import { toast } from 'sonner';

const philippineProvinces = [
  'Metro Manila',
  'Cebu',
  'Davao del Sur',
  'Laguna',
  'Cavite',
  'Bulacan',
  'Negros Occidental',
  'Pampanga',
  'Pangasinan',
  'Rizal',
  'Batangas',
  'Iloilo',
  'Nueva Ecija',
  'Quezon',
  'Camarines Sur',
  'Albay',
  'Bohol',
  'Leyte',
  'Misamis Oriental',
  'Cagayan'
];

const commonAmenities = [
  'WiFi',
  'Air Conditioning',
  'Parking',
  'Security',
  'Elevator',
  'Swimming Pool',
  'Gym',
  'Laundry',
  'Balcony',
  'Garden',
  'CCTV',
  'Generator',
  'Water Heater',
  'Kitchen',
  'Refrigerator',
  'Cable TV',
  'Pets Allowed',
  'Furnished'
];

export default function NewPropertyPage() {
  const { authState } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<PropertyFormData>({
    name: '',
    type: 'residential',
    address: '',
    city: '',
    province: '',
    postal_code: '',
    coordinates: undefined,
    total_units: 1,
    monthly_rent: 0,
    status: 'active',
    description: '',
    amenities: [],
    images: [],
    thumbnail: '',
    floor_plan: '',
    property_rules: ''
  });

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState('');
  const [propertyImages, setPropertyImages] = useState<string[]>([]);
  const [thumbnailImage, setThumbnailImage] = useState<string[]>([]);
  const [floorPlanImage, setFloorPlanImage] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<{
    property: File[];
    thumbnail: File[];
    floor_plan: File[];
  }>({
    property: [],
    thumbnail: [],
    floor_plan: []
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Property name is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.province) newErrors.province = 'Province is required';
    if (formData.total_units < 1)
      newErrors.total_units = 'Must have at least 1 unit';
    if (formData.monthly_rent <= 0)
      newErrors.monthly_rent = 'Monthly rent must be greater than 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !authState.user?.id) return;

    try {
      setIsLoading(true);

      const propertyData = {
        ...formData,
        owner_id: authState.user.id,
        amenities: selectedAmenities,
        images: propertyImages,
        thumbnail: thumbnailImage[0] || '',
        floor_plan: floorPlanImage[0] || '',
        postal_code: formData.postal_code || ''
      };

      const result = await PropertiesAPI.createProperty(propertyData);

      if (result.success && result.data?.id) {
        const propertyId = result.data.id;

        // Upload images after property creation
        const uploadPromises: Promise<any>[] = [];
        const uploadedUrls: {
          property: string[];
          thumbnail: string;
          floor_plan: string;
        } = {
          property: [],
          thumbnail: '',
          floor_plan: ''
        };

        // Upload property images
        for (const file of imageFiles.property) {
          uploadPromises.push(
            PropertiesAPI.uploadPropertyImage(
              propertyId,
              file,
              'property'
            ).then(result => {
              if (result.success && result.url) {
                uploadedUrls.property.push(result.url);
              }
            })
          );
        }

        // Upload thumbnail
        if (imageFiles.thumbnail[0]) {
          uploadPromises.push(
            PropertiesAPI.uploadPropertyImage(
              propertyId,
              imageFiles.thumbnail[0],
              'thumbnail'
            ).then(result => {
              if (result.success && result.url) {
                uploadedUrls.thumbnail = result.url;
              }
            })
          );
        }

        // Upload floor plan
        if (imageFiles.floor_plan[0]) {
          uploadPromises.push(
            PropertiesAPI.uploadPropertyImage(
              propertyId,
              imageFiles.floor_plan[0],
              'floor_plan'
            ).then(result => {
              if (result.success && result.url) {
                uploadedUrls.floor_plan = result.url;
              }
            })
          );
        }

        // Wait for all uploads to complete
        if (uploadPromises.length > 0) {
          await Promise.all(uploadPromises);

          // Update property with image URLs
          await PropertiesAPI.updatePropertyImages(
            propertyId,
            uploadedUrls.property,
            uploadedUrls.thumbnail,
            uploadedUrls.floor_plan
          );
        }

        toast.success('Property created successfully!');
        router.push('/owner/dashboard/properties');
      } else {
        toast.error(result.message || 'Failed to create property');
      }
    } catch (error) {
      console.error('Create property error:', error);
      toast.error('Failed to create property');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof PropertyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addAmenity = (amenity: string) => {
    if (amenity && !selectedAmenities.includes(amenity)) {
      setSelectedAmenities(prev => [...prev, amenity]);
    }
  };

  const removeAmenity = (amenity: string) => {
    setSelectedAmenities(prev => prev.filter(a => a !== amenity));
  };

  const addCustomAmenity = () => {
    if (customAmenity.trim()) {
      addAmenity(customAmenity.trim());
      setCustomAmenity('');
    }
  };

  // Handle image uploads for new property (store files locally until property is created)
  const handleImageChange = (
    imageType: 'property' | 'thumbnail' | 'floor_plan'
  ) => {
    return (urls: string[]) => {
      if (imageType === 'property') {
        setPropertyImages(urls);
      } else if (imageType === 'thumbnail') {
        setThumbnailImage(urls);
      } else if (imageType === 'floor_plan') {
        setFloorPlanImage(urls);
      }
    };
  };

  const handleFileChange = (
    imageType: 'property' | 'thumbnail' | 'floor_plan'
  ) => {
    return (files: File[]) => {
      setImageFiles(prev => ({
        ...prev,
        [imageType]: files
      }));
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-white to-blue-50/50 shadow-sm border-b border-blue-100">
        <div className="px-6 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-blue-600 hover:bg-blue-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
                Add New Property
              </h1>
              <p className="text-blue-600/80 font-medium">
                Create a new property listing
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-600" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Property Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={e => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Sunset Apartments"
                      className={
                        errors.name
                          ? 'border-red-500'
                          : 'border-blue-200 focus:ring-blue-500'
                      }
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Property Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={value => handleInputChange('type', value)}>
                      <SelectTrigger className="border-blue-200 focus:ring-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="dormitory">Dormitory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e =>
                      handleInputChange('description', e.target.value)
                    }
                    placeholder="Describe your property, its features, and what makes it special..."
                    rows={4}
                    className="border-blue-200 focus:ring-blue-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Location Information */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Location Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="address">Full Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={e => handleInputChange('address', e.target.value)}
                    placeholder="e.g., 123 Main Street, Barangay Centro"
                    className={
                      errors.address
                        ? 'border-red-500'
                        : 'border-blue-200 focus:ring-blue-500'
                    }
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.address}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={e => handleInputChange('city', e.target.value)}
                      placeholder="e.g., Makati"
                      className={
                        errors.city
                          ? 'border-red-500'
                          : 'border-blue-200 focus:ring-blue-500'
                      }
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.city}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="province">Province *</Label>
                    <Select
                      value={formData.province}
                      onValueChange={value =>
                        handleInputChange('province', value)
                      }>
                      <SelectTrigger
                        className={
                          errors.province
                            ? 'border-red-500'
                            : 'border-blue-200 focus:ring-blue-500'
                        }>
                        <SelectValue placeholder="Select province" />
                      </SelectTrigger>
                      <SelectContent>
                        {philippineProvinces.map(province => (
                          <SelectItem key={province} value={province}>
                            {province}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.province && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.province}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={e =>
                        handleInputChange('postal_code', e.target.value)
                      }
                      placeholder="e.g., 1200"
                      className="border-blue-200 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="total_units">Total Units *</Label>
                    <Input
                      id="total_units"
                      type="number"
                      min="1"
                      value={formData.total_units}
                      onChange={e =>
                        handleInputChange(
                          'total_units',
                          parseInt(e.target.value) || 1
                        )
                      }
                      className={
                        errors.total_units
                          ? 'border-red-500'
                          : 'border-blue-200 focus:ring-blue-500'
                      }
                    />
                    {errors.total_units && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.total_units}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthly_rent">Monthly Rent (₱) *</Label>
                    <Input
                      id="monthly_rent"
                      type="number"
                      min="0"
                      step="100"
                      value={formData.monthly_rent}
                      onChange={e =>
                        handleInputChange(
                          'monthly_rent',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="e.g., 15000"
                      className={
                        errors.monthly_rent
                          ? 'border-red-500'
                          : 'border-blue-200 focus:ring-blue-500'
                      }
                    />
                    {errors.monthly_rent && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.monthly_rent}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={value =>
                        handleInputChange('status', value)
                      }>
                      <SelectTrigger className="border-blue-200 focus:ring-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="maintenance">
                          Under Maintenance
                        </SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" />
                  Amenities & Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {commonAmenities.map(amenity => (
                    <Button
                      key={amenity}
                      type="button"
                      variant={
                        selectedAmenities.includes(amenity)
                          ? 'default'
                          : 'outline'
                      }
                      size="sm"
                      onClick={() =>
                        selectedAmenities.includes(amenity)
                          ? removeAmenity(amenity)
                          : addAmenity(amenity)
                      }
                      className={
                        selectedAmenities.includes(amenity)
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                      }>
                      {amenity}
                    </Button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    value={customAmenity}
                    onChange={e => setCustomAmenity(e.target.value)}
                    placeholder="Add custom amenity"
                    className="border-blue-200 focus:ring-blue-500"
                    onKeyPress={e =>
                      e.key === 'Enter' &&
                      (e.preventDefault(), addCustomAmenity())
                    }
                  />
                  <Button
                    type="button"
                    onClick={addCustomAmenity}
                    variant="outline"
                    className="border-blue-200 text-blue-600">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {selectedAmenities.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Amenities:</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedAmenities.map(amenity => (
                        <Badge
                          key={amenity}
                          variant="secondary"
                          className="bg-blue-100 text-blue-700">
                          {amenity}
                          <X
                            className="w-3 h-3 ml-1 cursor-pointer hover:text-red-600"
                            onClick={() => removeAmenity(amenity)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location Coordinates */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  GPS Coordinates (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={formData.coordinates?.lat || ''}
                      onChange={e =>
                        handleInputChange('coordinates', {
                          ...formData.coordinates,
                          lat: parseFloat(e.target.value) || 0
                        })
                      }
                      placeholder="e.g., 14.5995"
                      className="border-blue-200 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={formData.coordinates?.lng || ''}
                      onChange={e =>
                        handleInputChange('coordinates', {
                          ...formData.coordinates,
                          lng: parseFloat(e.target.value) || 0
                        })
                      }
                      placeholder="e.g., 120.9842"
                      className="border-blue-200 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  GPS coordinates help tenants find your property more easily.
                  You can get these from Google Maps.
                </p>
              </CardContent>
            </Card>

            {/* Property Images */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-blue-600" />
                  Property Images
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Main Property Images */}
                <div className="space-y-2">
                  <Label>Property Photos</Label>
                  <p className="text-sm text-gray-600">
                    Upload high-quality photos of your property (main images)
                  </p>
                  <div className="border-2 border-dashed border-blue-200 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={e => {
                        if (e.target.files) {
                          const files = Array.from(e.target.files);
                          setImageFiles(prev => ({ ...prev, property: files }));
                          const urls = files.map(file =>
                            URL.createObjectURL(file)
                          );
                          setPropertyImages(urls);
                        }
                      }}
                      className="hidden"
                      id="property-images"
                    />
                    <label htmlFor="property-images" className="cursor-pointer">
                      <Camera className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                      <p className="text-blue-600 font-medium">
                        Click to upload property images
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        or drag and drop
                      </p>
                    </label>
                  </div>
                  {propertyImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                      {propertyImages.map((url, index) => (
                        <div key={index} className="relative">
                          <img
                            src={url}
                            alt={`Property ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newImages = propertyImages.filter(
                                (_, i) => i !== index
                              );
                              const newFiles = imageFiles.property.filter(
                                (_, i) => i !== index
                              );
                              setPropertyImages(newImages);
                              setImageFiles(prev => ({
                                ...prev,
                                property: newFiles
                              }));
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Thumbnail Image */}
                <div className="space-y-2">
                  <Label>Thumbnail Image</Label>
                  <p className="text-sm text-gray-600">
                    Main image that represents your property (shown in listings)
                  </p>
                  <div className="border-2 border-dashed border-blue-200 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setImageFiles(prev => ({
                            ...prev,
                            thumbnail: [file]
                          }));
                          const url = URL.createObjectURL(file);
                          setThumbnailImage([url]);
                        }
                      }}
                      className="hidden"
                      id="thumbnail-image"
                    />
                    <label htmlFor="thumbnail-image" className="cursor-pointer">
                      {thumbnailImage.length > 0 ? (
                        <div className="relative inline-block">
                          <img
                            src={thumbnailImage[0]}
                            alt="Thumbnail"
                            className="w-32 h-32 object-cover rounded-lg mx-auto"
                          />
                          <button
                            type="button"
                            onClick={e => {
                              e.preventDefault();
                              setThumbnailImage([]);
                              setImageFiles(prev => ({
                                ...prev,
                                thumbnail: []
                              }));
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                          <p className="text-blue-600 font-medium">
                            Click to upload thumbnail
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Floor Plan */}
                <div className="space-y-2">
                  <Label>Floor Plan</Label>
                  <p className="text-sm text-gray-600">
                    Upload a floor plan or layout diagram of your property
                  </p>
                  <div className="border-2 border-dashed border-blue-200 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setImageFiles(prev => ({
                            ...prev,
                            floor_plan: [file]
                          }));
                          const url = URL.createObjectURL(file);
                          setFloorPlanImage([url]);
                        }
                      }}
                      className="hidden"
                      id="floor-plan-image"
                    />
                    <label
                      htmlFor="floor-plan-image"
                      className="cursor-pointer">
                      {floorPlanImage.length > 0 ? (
                        <div className="relative inline-block">
                          <img
                            src={floorPlanImage[0]}
                            alt="Floor Plan"
                            className="w-32 h-32 object-cover rounded-lg mx-auto"
                          />
                          <button
                            type="button"
                            onClick={e => {
                              e.preventDefault();
                              setFloorPlanImage([]);
                              setImageFiles(prev => ({
                                ...prev,
                                floor_plan: []
                              }));
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <FileImage className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                          <p className="text-blue-600 font-medium">
                            Click to upload floor plan
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Rules */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Property Rules & Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="property_rules">Rules & Regulations</Label>
                  <Textarea
                    id="property_rules"
                    value={formData.property_rules}
                    onChange={e =>
                      handleInputChange('property_rules', e.target.value)
                    }
                    placeholder="e.g., No pets allowed, No smoking, Quiet hours from 10 PM to 6 AM..."
                    rows={6}
                    className="border-blue-200 focus:ring-blue-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="border-blue-200 text-blue-600 hover:bg-blue-50">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                {isLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Property
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
