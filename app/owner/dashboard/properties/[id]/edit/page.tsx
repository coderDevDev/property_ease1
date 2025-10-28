'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  Users,
  FileText,
  Plus,
  X,
  ArrowLeft,
  Save,
  AlertCircle,
  Camera
} from 'lucide-react';
import { PropertiesAPI, type PropertyFormData } from '@/lib/api/properties';
import { ImageUpload } from '@/components/ui/image-upload';
import { toast } from 'sonner';

// Bicol Region Location Data
const bicolLocationData: Record<string, { capital: string; cities: string[] }> = {
  'Albay': {
    capital: 'Legazpi City',
    cities: [
      'Legazpi City', 'Ligao City', 'Tabaco City', 'Bacacay', 'Camalig', 'Daraga',
      'Guinobatan', 'Jovellar', 'Libon', 'Malilipot', 'Malinao', 'Manito', 'Oas',
      'Pio Duran', 'Polangui', 'Rapu-Rapu', 'Santo Domingo'
    ]
  },
  'Camarines Norte': {
    capital: 'Daet',
    cities: [
      'Basud', 'Capalonga', 'Daet', 'Jose Panganiban', 'Labo', 'Mercedes',
      'Paracale', 'San Lorenzo Ruiz', 'San Vicente', 'Santa Elena', 'Talisay', 'Vinzons'
    ]
  },
  'Camarines Sur': {
    capital: 'Pili',
    cities: [
      'Iriga City', 'Naga City', 'Baao', 'Balatan', 'Bato', 'Bombon', 'Buhi', 'Bula',
      'Cabusao', 'Calabanga', 'Camaligan', 'Canaman', 'Caramoan', 'Del Gallego', 'Gainza',
      'Garchitorena', 'Goa', 'Lagonoy', 'Libmanan', 'Lupi', 'Magarao', 'Milaor', 'Minalabac',
      'Nabua', 'Ocampo', 'Pamplona', 'Pasacao', 'Pili', 'Presentacion', 'Ragay',
      'San Fernando', 'San Jose', 'Sipocot', 'Siruma', 'Tigaon', 'Tinambac'
    ]
  },
  'Catanduanes': {
    capital: 'Virac',
    cities: [
      'Bagamanoc', 'Baras', 'Bato', 'Caramoran', 'Gigmoto', 'Pandan', 'Panganiban',
      'San Andres', 'San Miguel', 'Viga', 'Virac'
    ]
  },
  'Masbate': {
    capital: 'Masbate City',
    cities: [
      'Masbate City', 'Aroroy', 'Baleno', 'Balud', 'Batuan', 'Cataingan', 'Cawayan',
      'Claveria', 'Dimasalang', 'Esperanza', 'Mandaon', 'Milagros', 'Mobo', 'Monreal',
      'Palanas', 'Pio V. Corpuz', 'Placer', 'San Fernando', 'San Jacinto', 'San Pascual', 'Uson'
    ]
  },
  'Sorsogon': {
    capital: 'Sorsogon City',
    cities: [
      'Sorsogon City', 'Barcelona', 'Bulan', 'Bulusan', 'Casiguran', 'Castilla', 'Donsol',
      'Gubat', 'Irosin', 'Juban', 'Magallanes', 'Matnog', 'Pilar', 'Prieto Diaz', 'Santa Magdalena'
    ]
  }
};

const bicolProvinces = Object.keys(bicolLocationData).sort();

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

export default function EditPropertyPage() {
  const { authState } = useAuth();
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
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
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  useEffect(() => {
    const loadProperty = async () => {
      if (!propertyId) return;

      try {
        setIsLoadingData(true);
        const result = await PropertiesAPI.getProperty(propertyId);

        if (result.success && result.data) {
          const property = result.data;
          setFormData({
            name: property.name,
            type: property.type,
            address: property.address,
            city: property.city,
            province: property.province,
            postal_code: property.postal_code || '',
            coordinates: property.coordinates || undefined,
            total_units: property.total_units,
            monthly_rent: property.monthly_rent,
            status: property.status,
            description: property.description || '',
            amenities: property.amenities || [],
            images: property.images || [],
            thumbnail: property.thumbnail || '',
            floor_plan: property.floor_plan || '',
            property_rules: property.property_rules || ''
          });
          setSelectedAmenities(property.amenities || []);
          setPropertyImages(property.images || []);
          setThumbnailImage(property.thumbnail ? [property.thumbnail] : []);
          setFloorPlanImage(property.floor_plan ? [property.floor_plan] : []);
          // Set available cities based on loaded province
          if (property.province && bicolLocationData[property.province]) {
            setAvailableCities(bicolLocationData[property.province].cities);
          }
        } else {
          toast.error('Failed to load property details');
          router.push('/owner/dashboard/properties');
        }
      } catch (error) {
        console.error('Failed to load property:', error);
        toast.error('Failed to load property details');
        router.push('/owner/dashboard/properties');
      } finally {
        setIsLoadingData(false);
      }
    };

    loadProperty();
  }, [propertyId, router]);

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

    if (!validateForm()) return;

    try {
      setIsLoading(true);

      const updateData = {
        ...formData,
        amenities: selectedAmenities,
        images: propertyImages,
        thumbnail: thumbnailImage[0] || '',
        floor_plan: floorPlanImage[0] || '',
        updated_at: new Date().toISOString()
      };

      const result = await PropertiesAPI.updateProperty(propertyId, updateData);

      if (result.success) {
        toast.success('Property updated successfully!');
        router.push(`/owner/dashboard/properties/${propertyId}`);
      } else {
        toast.error(result.message || 'Failed to update property');
      }
    } catch (error) {
      console.error('Update property error:', error);
      toast.error('Failed to update property');
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

  const handleProvinceChange = (province: string) => {
    setFormData(prev => ({ ...prev, province, city: '' }));
    setAvailableCities(bicolLocationData[province]?.cities || []);
    if (errors.province) {
      setErrors(prev => ({ ...prev, province: '' }));
    }
    if (errors.city) {
      setErrors(prev => ({ ...prev, city: '' }));
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

  if (isLoadingData) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-white to-blue-50/50 shadow-sm border-b border-blue-100">
        <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
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
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
                Edit Property
              </h1>
              <p className="text-blue-600/80 font-medium text-sm sm:text-base">
                Update property information
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* Basic Information */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Building className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
                    <Label htmlFor="province">Province *</Label>
                    <Select
                      value={formData.province}
                      onValueChange={handleProvinceChange}>
                      <SelectTrigger
                        className={
                          errors.province
                            ? 'border-red-500'
                            : 'border-blue-200 focus:ring-blue-500'
                        }>
                        <SelectValue placeholder="Select province first" />
                      </SelectTrigger>
                      <SelectContent>
                        {bicolProvinces.map((province: string) => (
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
                    <Label htmlFor="city">City/Municipality *</Label>
                    <Select
                      value={formData.city}
                      onValueChange={value => handleInputChange('city', value)}
                      disabled={!formData.province || availableCities.length === 0}>
                      <SelectTrigger
                        className={
                          errors.city
                            ? 'border-red-500'
                            : 'border-blue-200 focus:ring-blue-500'
                        }>
                        <SelectValue placeholder={
                          formData.province 
                            ? "Select city/municipality" 
                            : "Select province first"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCities.map((city: string) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.city && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.city}
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
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  Amenities & Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6 pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
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
                      className={`text-xs sm:text-sm ${
                        selectedAmenities.includes(amenity)
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                      }`}>
                      {amenity}
                    </Button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={customAmenity}
                    onChange={e => setCustomAmenity(e.target.value)}
                    placeholder="Add custom amenity"
                    className="border-blue-200 focus:ring-blue-500 text-sm sm:text-base"
                    onKeyPress={e =>
                      e.key === 'Enter' &&
                      (e.preventDefault(), addCustomAmenity())
                    }
                  />
                  <Button
                    type="button"
                    onClick={addCustomAmenity}
                    variant="outline"
                    className="border-blue-200 text-blue-600 text-sm sm:text-base">
                    <Plus className="w-4 h-4 mr-2" />
                    Add
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
                <ImageUpload
                  label="Property Photos"
                  description="Upload high-quality photos of your property (main images)"
                  multiple={true}
                  maxFiles={10}
                  maxFileSize={10}
                  existingImages={propertyImages}
                  onChange={setPropertyImages}
                  imageType="property"
                  propertyId={propertyId}
                />

                {/* Thumbnail Image */}
                <ImageUpload
                  label="Thumbnail Image"
                  description="Main image that represents your property (shown in listings)"
                  multiple={false}
                  maxFiles={1}
                  maxFileSize={5}
                  existingImages={thumbnailImage}
                  onChange={setThumbnailImage}
                  imageType="thumbnail"
                  propertyId={propertyId}
                />

                {/* Floor Plan */}
                <ImageUpload
                  label="Floor Plan"
                  description="Upload a floor plan or layout diagram of your property"
                  multiple={false}
                  maxFiles={1}
                  maxFileSize={5}
                  existingImages={floorPlanImage}
                  onChange={setFloorPlanImage}
                  imageType="floor_plan"
                  propertyId={propertyId}
                />
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
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="border-blue-200 text-blue-600 hover:bg-blue-50 text-sm sm:text-base">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base">
                {isLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Property
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
