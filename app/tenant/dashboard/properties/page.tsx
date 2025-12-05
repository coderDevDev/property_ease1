'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Search,
  MapPin,
  BedDouble,
  Users,
  Wifi,
  Car,
  Waves,
  Shield,
  Star,
  Eye,
  Heart,
  Filter,
  SlidersHorizontal,
  Building,
  Calendar,
  CheckCircle,
  Phone,
  Mail,
  MessageSquare,
  PhilippinePeso,
  AlertTriangle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TenantAPI, type PropertyListing } from '@/lib/api/tenant';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { cn, formatPropertyType } from '@/lib/utils';
import { toast } from 'sonner';

// PropertyListing is now imported from TenantAPI

interface SearchFilters {
  query: string;
  city: string;
  type: string;
  minRent: number;
  maxRent: number;
  sortBy: 'rent_asc' | 'rent_desc' | 'rating' | 'newest';
}

export default function TenantPropertiesPage() {
  const router = useRouter();
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<
    PropertyListing[]
  >([]);
  const [selectedProperty, setSelectedProperty] =
    useState<PropertyListing | null>(null);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showFiltersPopover, setShowFiltersPopover] = useState(false);

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    city: 'all',
    type: 'all',
    minRent: 0,
    maxRent: 50000,
    sortBy: 'newest'
  });

  const [favorites, setFavorites] = useState<string[]>([]);
  const [pendingApplications, setPendingApplications] = useState<string[]>([]);
  const [approvedApplications, setApprovedApplications] = useState<string[]>([]);

  // Fetch pending and approved applications
  useEffect(() => {
    const fetchApplications = async () => {
      if (!authState.user?.id) return;
      try {
        // Fetch pending applications
        const { data: pendingApps } = await supabase
          .from('rental_applications')
          .select('property_id')
          .eq('user_id', authState.user.id)
          .eq('status', 'pending');

        if (pendingApps) {
          setPendingApplications(
            pendingApps.map((app: { property_id: string }) => app.property_id)
          );
        }

        // Fetch approved applications (active rentals)
        const { data: approvedApps } = await supabase
          .from('rental_applications')
          .select('property_id')
          .eq('user_id', authState.user.id)
          .eq('status', 'approved');

        if (approvedApps) {
          setApprovedApplications(
            approvedApps.map((app: { property_id: string }) => app.property_id)
          );
        }
      } catch (error) {
        console.error('Failed to fetch applications:', error);
      }
    };

    fetchApplications();
  }, [authState.user?.id]);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);

        const result = await TenantAPI.getAvailableProperties();

        if (result.success && result.data) {
          setProperties(result.data);
          setFilteredProperties(result.data);
        } else {
          console.error('Failed to fetch properties:', result.message);
          setProperties([]);
          setFilteredProperties([]);
        }
      } catch (error) {
        console.error('Failed to fetch properties:', error);
        setProperties([]);
        setFilteredProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = [...properties];

    if (filters.query) {
      filtered = filtered.filter(
        property =>
          property.name.toLowerCase().includes(filters.query.toLowerCase()) ||
          property.address
            .toLowerCase()
            .includes(filters.query.toLowerCase()) ||
          (property.description || '')
            .toLowerCase()
            .includes(filters.query.toLowerCase())
      );
    }

    if (filters.city && filters.city !== 'all') {
      filtered = filtered.filter(property => property.city === filters.city);
    }

    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(property => property.type === filters.type);
    }

    filtered = filtered.filter(
      property =>
        property.monthly_rent >= filters.minRent &&
        property.monthly_rent <= filters.maxRent
    );

    // Apply sorting
    switch (filters.sortBy) {
      case 'rent_asc':
        filtered.sort((a, b) => a.monthly_rent - b.monthly_rent);
        break;
      case 'rent_desc':
        filtered.sort((a, b) => b.monthly_rent - a.monthly_rent);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
    }

    setFilteredProperties(filtered);
  }, [properties, filters]);

  const handleApplyToProperty = async (property: PropertyListing) => {
    if (!authState.user?.id) return;

    // Check if user already has a pending application
    const hasPending = await TenantAPI.hasPendingApplication(
      authState.user.id,
      property.id
    );
    if (hasPending) {
      toast.info(
        'You already have a pending application for this property. Redirecting to your applications...'
      );
      router.push('/tenant/dashboard/applications');
      return;
    }

    setSelectedProperty(property);
    setShowApplicationDialog(true);
  };

  const handleToggleFavorite = (propertyId: string) => {
    setFavorites(prev =>
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handleContactOwner = (property: PropertyListing) => {
    setSelectedProperty(property);
    setShowContactDialog(true);
  };

  const handleCallOwner = (phoneNumber: string) => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  const cities = [...new Set(properties.map(p => p.city))];
  const propertyTypes = [...new Set(properties.map(p => p.type))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-3 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-blue-600 font-medium text-sm sm:text-base">
              Loading available properties...
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
              Find Your Perfect Home
            </h1>
            <p className="text-blue-600/70 mt-1 text-sm sm:text-base">
              Discover amazing properties available for rent in your area
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Search Input */}
              <div className="flex-1">
                <Label
                  htmlFor="search"
                  className="text-sm font-medium text-gray-700 mb-2 block">
                  Search Properties
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by name, location..."
                    value={filters.query}
                    onChange={e =>
                      setFilters(prev => ({ ...prev, query: e.target.value }))
                    }
                    className="pl-10 focus:border-blue-500 text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Advanced Filters Button */}
              <div className="flex items-end">
                <Popover
                  open={showFiltersPopover}
                  onOpenChange={setShowFiltersPopover}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-blue-200 text-blue-600 hover:bg-blue-50 text-sm sm:text-base">
                      <Filter className="w-4 h-4 mr-2" />
                      Filters
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4" align="end">
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">
                        Advanced Filters
                      </h4>

                      {/* City Filter */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          City
                        </Label>
                        <Select
                          value={filters.city}
                          onValueChange={value =>
                            setFilters(prev => ({ ...prev, city: value }))
                          }>
                          <SelectTrigger className="focus:border-blue-500 text-sm sm:text-base">
                            <SelectValue placeholder="All Cities" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Cities</SelectItem>
                            {cities.map(city => (
                              <SelectItem key={city} value={city}>
                                {city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Type Filter */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Type
                        </Label>
                        <Select
                          value={filters.type}
                          onValueChange={value =>
                            setFilters(prev => ({ ...prev, type: value }))
                          }>
                          <SelectTrigger className="focus:border-blue-500 text-sm sm:text-base">
                            <SelectValue placeholder="All Types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {propertyTypes.map(type => (
                              <SelectItem key={type} value={type}>
                                {formatPropertyType(type)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Price Range */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Max Rent
                        </Label>
                        <Select
                          value={filters.maxRent.toString()}
                          onValueChange={value =>
                            setFilters(prev => ({
                              ...prev,
                              maxRent: parseInt(value)
                            }))
                          }>
                          <SelectTrigger className="focus:border-blue-500 text-sm sm:text-base">
                            <SelectValue placeholder="Any Price" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="50000">Any Price</SelectItem>
                            <SelectItem value="10000">₱10,000</SelectItem>
                            <SelectItem value="15000">₱15,000</SelectItem>
                            <SelectItem value="20000">₱20,000</SelectItem>
                            <SelectItem value="30000">₱30,000</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Sort By */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Sort By
                        </Label>
                        <Select
                          value={filters.sortBy}
                          onValueChange={(value: any) =>
                            setFilters(prev => ({ ...prev, sortBy: value }))
                          }>
                          <SelectTrigger className="focus:border-blue-500 text-sm sm:text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="newest">Newest First</SelectItem>
                            <SelectItem value="rent_asc">
                              Price: Low to High
                            </SelectItem>
                            <SelectItem value="rent_desc">
                              Price: High to Low
                            </SelectItem>
                            <SelectItem value="rating">
                              Highest Rated
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Clear Filters */}
                      <Button
                        variant="outline"
                        onClick={() => {
                          setFilters({
                            query: '',
                            city: 'all',
                            type: 'all',
                            minRent: 0,
                            maxRent: 50000,
                            sortBy: 'newest'
                          });
                          setShowFiltersPopover(false);
                        }}
                        className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 text-sm sm:text-base">
                        Clear Filters
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <p className="text-gray-600 text-sm sm:text-base">
            Showing {filteredProperties.length} of {properties.length}{' '}
            properties
          </p>
        </div>

        {/* Property Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredProperties.map(property => (
            <Card
              key={property.id}
              className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden">
              {/* Property Image */}
              <div className="relative h-40 sm:h-48 overflow-hidden">
                <img
                  src={
                    property.thumbnail ||
                    property.images?.[0] ||
                    '/api/placeholder/400/300'
                  }
                  alt={property.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
                <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-col gap-1.5">
                  <Badge className="bg-blue-600 text-white text-xs">
                    {formatPropertyType(property.type)}
                  </Badge>
                  {property.is_featured && (
                    <Badge className="bg-yellow-500 text-white text-xs flex items-center gap-1">
                      <Star className="w-3 h-3 fill-white" />
                      Featured
                    </Badge>
                  )}
                </div>
                <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex gap-1 sm:gap-2">
                  {/* <Button
                    size="sm"
                    variant="secondary"
                    className="w-6 h-6 sm:w-8 sm:h-8 p-0 bg-white/90 hover:bg-white"
                    onClick={() => handleToggleFavorite(property.id)}>
                    <Heart
                      className={`w-3 h-3 sm:w-4 sm:h-4 ${
                        favorites.includes(property.id)
                          ? 'text-red-500 fill-red-500'
                          : 'text-gray-600'
                      }`}
                    />
                  </Button> */}
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-6 h-6 sm:w-8 sm:h-8 p-0 bg-white/90 hover:bg-white"
                    onClick={() =>
                      router.push(`/tenant/dashboard/properties/${property.id}`)
                    }>
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                  </Button>
                </div>
                <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3">
                  <Badge
                    className={`text-xs ${
                      property.available_units > 0
                        ? 'bg-green-600'
                        : 'bg-red-600'
                    } text-white`}>
                    {property.available_units > 0
                      ? `${property.available_units} Available`
                      : 'Fully Occupied'}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-3 sm:p-6">
                {/* Property Details */}
                <div className="mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="font-mono text-xs bg-blue-50 text-blue-700 border-blue-300">
                      {property.property_code}
                    </Badge>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                    {property.name}
                  </h3>
                  <div className="flex items-center gap-1 text-gray-600 mb-2">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">
                      {property.address}, {property.city}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs sm:text-sm font-medium">
                        {property.rating?.toFixed(2) || '0.00'}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-500">
                        ({property.reviewCount || 0})
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                      <span className="text-xs sm:text-sm text-gray-600">
                        {property.total_units} units
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-3 sm:mb-4">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">
                    ₱{property.monthly_rent.toLocaleString()}
                    <span className="text-xs sm:text-sm font-normal text-gray-600">
                      /month
                    </span>
                  </div>
                </div>

                {/* Room Availability Details */}
                {(() => {
                  // Only show occupied rooms that are within valid range and active
                  const occupiedRooms = (property.tenants || [])
                    .filter(t => t.status === 'active')
                    .map(t => {
                      const match = t.unit_number.match(/\d+/);
                      return match ? parseInt(match[0]) : null;
                    })
                    .filter(n => n !== null && n >= 1 && n <= property.total_units)
                    .sort((a, b) => a! - b!);
                  
                  const allRooms = Array.from({ length: property.total_units }, (_, i) => i + 1);
                  const availableRooms = allRooms.filter(r => !occupiedRooms.includes(r));

                  return (
                    <div className="mb-3 sm:mb-4 space-y-2 text-xs">
                      {availableRooms.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="text-green-600 font-medium whitespace-nowrap">Available:</span>
                          <span className="text-gray-700 flex-1">
                            {availableRooms.length <= 5 
                              ? `Room ${availableRooms.join(', ')}`
                              : `Room ${availableRooms.slice(0, 5).join(', ')} +${availableRooms.length - 5} more`
                            }
                          </span>
                        </div>
                      )}
                      {occupiedRooms.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="text-red-600 font-medium whitespace-nowrap">Occupied:</span>
                          <span className="text-gray-700 flex-1">
                            {occupiedRooms.length <= 5
                              ? `Room ${occupiedRooms.join(', ')}`
                              : `Room ${occupiedRooms.slice(0, 5).join(', ')} +${occupiedRooms.length - 5} more`
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Amenities */}
                <div className="mb-3 sm:mb-4">
                  <div className="flex flex-wrap gap-1">
                    {property.featured_amenities.slice(0, 3).map(amenity => (
                      <Badge
                        key={amenity}
                        variant="secondary"
                        className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                    {property.amenities.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{property.amenities.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Owner Info */}
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
                    <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                      {formatPropertyType(property.type)}
                    </Badge>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                      {property.owner_name}
                    </p>
                    <p className="text-xs text-gray-600">Property Owner</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-6 w-6 sm:h-8 sm:w-8 p-0"
                    onClick={() => handleContactOwner(property)}>
                    <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    className={cn(
                      'flex-1 text-xs sm:text-sm',
                      approvedApplications.includes(property.id)
                        ? 'bg-green-600 hover:bg-green-700'
                        : pendingApplications.includes(property.id)
                        ? 'bg-yellow-500 hover:bg-yellow-600'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                    )}
                    onClick={() => {
                      if (approvedApplications.includes(property.id)) {
                        router.push('/tenant/dashboard/applications');
                      } else {
                        handleApplyToProperty(property);
                      }
                    }}
                    disabled={
                      property.available_units === 0 ||
                      pendingApplications.includes(property.id)
                    }>
                    {approvedApplications.includes(property.id)
                      ? 'Currently Renting'
                      : pendingApplications.includes(property.id)
                      ? 'Application Pending'
                      : property.available_units > 0
                      ? 'Apply Now'
                      : 'Fully Occupied'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push(`/tenant/dashboard/properties/${property.id}`)
                    }
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 text-xs sm:text-sm">
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className=" sm:inline">View</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProperties.length === 0 && (
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
            <CardContent className="py-8 sm:py-12 text-center">
              <Building className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                No Properties Found
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6">
                We couldn't find any properties matching your criteria. Try
                adjusting your filters.
              </p>
              <Button
                onClick={() =>
                  setFilters({
                    query: '',
                    city: 'all',
                    type: 'all',
                    minRent: 0,
                    maxRent: 50000,
                    sortBy: 'newest'
                  })
                }
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-sm sm:text-base">
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Application Dialog */}
        <Dialog
          open={showApplicationDialog}
          onOpenChange={setShowApplicationDialog}>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                Apply to {selectedProperty?.name}
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Submit your application to rent a unit at this property.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <PhilippinePeso className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                  <span className="font-medium text-blue-800 text-sm sm:text-base">
                    Monthly Rent
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-blue-900">
                  ₱{selectedProperty?.monthly_rent.toLocaleString()}/month
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                  <span>Background check required</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                  <span>Employment verification needed</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                  <span>Security deposit: 2 months rent</span>
                </div>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowApplicationDialog(false)}
                className="text-sm sm:text-base">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!selectedProperty) return;
                  setShowApplicationDialog(false);
                  router.push(
                    `/tenant/dashboard/applications/new?propertyId=${selectedProperty.id}`
                  );
                }}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-sm sm:text-base">
                Continue Application
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Contact Owner Dialog */}
        <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                Contact Property Owner
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Get in touch with {selectedProperty?.owner_name} about{' '}
                {selectedProperty?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                    {selectedProperty?.owner_name
                      .split(' ')
                      .map(n => n[0])
                      .join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-sm sm:text-base">
                      {selectedProperty?.owner_name}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Property Owner
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {/* Email */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-600">Email</p>
                    <p className="text-sm sm:text-base font-medium">
                      {selectedProperty?.owner_email}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.open(
                        `mailto:${selectedProperty?.owner_email}`,
                        '_self'
                      );
                    }}
                    className="border-blue-200 text-blue-600 hover:bg-blue-50 text-xs sm:text-sm">
                    Send Email
                  </Button>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-4 h-4 text-green-600" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-600">Phone</p>
                    <p className="text-sm sm:text-base font-medium">
                      {selectedProperty?.owner_phone || 'Not available'}
                    </p>
                  </div>
                  {selectedProperty?.owner_phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleCallOwner(selectedProperty.owner_phone)
                      }
                      className="border-green-200 text-green-600 hover:bg-green-50 text-xs sm:text-sm">
                      Call Now
                    </Button>
                  )}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-yellow-800">
                      Contact Guidelines
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Please be respectful when contacting property owners. Ask
                      relevant questions about the property and your
                      application.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowContactDialog(false)}
                className="text-sm sm:text-base">
                Close
              </Button>
              <Button
                onClick={() => {
                  if (!selectedProperty) return;
                  setShowContactDialog(false);
                  router.push(
                    `/tenant/dashboard/messages?owner=${selectedProperty.owner_id}`
                  );
                }}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-sm sm:text-base">
                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
