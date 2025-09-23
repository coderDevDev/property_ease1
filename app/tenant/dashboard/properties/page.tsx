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
  PhilippinePeso
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TenantAPI, type PropertyListing } from '@/lib/api/tenant';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
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

  // Fetch pending applications
  useEffect(() => {
    const fetchPendingApplications = async () => {
      if (!authState.user?.id) return;
      try {
        const { data: applications } = await supabase
          .from('rental_applications')
          .select('property_id')
          .eq('user_id', authState.user.id)
          .eq('status', 'pending');

        if (applications) {
          setPendingApplications(
            applications.map((app: { property_id: string }) => app.property_id)
          );
        }
      } catch (error) {
        console.error('Failed to fetch pending applications:', error);
      }
    };

    fetchPendingApplications();
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
      toast.error(
        "You already have a pending application for this property. Please wait for the owner's response or check your applications page."
      );
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
    // TODO: Integrate with messaging system
    router.push(`/tenant/dashboard/messages?owner=${property.owner_id}`);
  };

  const cities = [...new Set(properties.map(p => p.city))];
  const propertyTypes = [...new Set(properties.map(p => p.type))];

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Find Your Perfect Home
        </h1>
        <p className="text-gray-600">
          Discover amazing properties available for rent in your area
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
        <CardContent className="p-6">
          <div className="grid lg:grid-cols-6 gap-4">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <Label
                htmlFor="search"
                className="text-sm font-medium text-gray-700 mb-2 block">
                Search Properties
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name, location, or description..."
                  value={filters.query}
                  onChange={e =>
                    setFilters(prev => ({ ...prev, query: e.target.value }))
                  }
                  className="pl-10 focus:border-blue-500"
                />
              </div>
            </div>

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
                <SelectTrigger className="focus:border-blue-500">
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
                <SelectTrigger className="focus:border-blue-500">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {propertyTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
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
                  setFilters(prev => ({ ...prev, maxRent: parseInt(value) }))
                }>
                <SelectTrigger className="focus:border-blue-500">
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
                <SelectTrigger className="focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="rent_asc">Price: Low to High</SelectItem>
                  <SelectItem value="rent_desc">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Showing {filteredProperties.length} of {properties.length} properties
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Advanced Filters
          </Button>
        </div>
      </div>

      {/* Property Grid */}
      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProperties.map(property => (
          <Card
            key={property.id}
            className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300 overflow-hidden">
            {/* Property Image */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={
                  property.thumbnail ||
                  property.images?.[0] ||
                  '/api/placeholder/400/300'
                }
                alt={property.name}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
              <div className="absolute top-3 left-3">
                <Badge className="bg-blue-600 text-white">
                  {property.type.charAt(0).toUpperCase() +
                    property.type.slice(1)}
                </Badge>
              </div>
              <div className="absolute top-3 right-3 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-8 h-8 p-0 bg-white/90 hover:bg-white"
                  onClick={() => handleToggleFavorite(property.id)}>
                  <Heart
                    className={`w-4 h-4 ${
                      favorites.includes(property.id)
                        ? 'text-red-500 fill-red-500'
                        : 'text-gray-600'
                    }`}
                  />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-8 h-8 p-0 bg-white/90 hover:bg-white"
                  onClick={() =>
                    router.push(`/tenant/dashboard/properties/${property.id}`)
                  }>
                  <Eye className="w-4 h-4 text-gray-600" />
                </Button>
              </div>
              <div className="absolute bottom-3 left-3">
                <Badge
                  className={`${
                    property.available_units > 0 ? 'bg-green-600' : 'bg-red-600'
                  } text-white`}>
                  {property.available_units > 0
                    ? `${property.available_units} Available`
                    : 'Fully Occupied'}
                </Badge>
              </div>
            </div>

            <CardContent className="p-6">
              {/* Property Details */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {property.name}
                </h3>
                <div className="flex items-center gap-1 text-gray-600 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">
                    {property.address}, {property.city}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-medium">
                      {property.rating}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({property.reviewCount})
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {property.total_units} units
                    </span>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <div className="text-2xl font-bold text-gray-900">
                  ₱{property.monthly_rent.toLocaleString()}
                  <span className="text-sm font-normal text-gray-600">
                    /month
                  </span>
                </div>
              </div>

              {/* Amenities */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {property.featured_amenities.slice(0, 4).map(amenity => (
                    <Badge
                      key={amenity}
                      variant="secondary"
                      className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                  {property.amenities.length > 4 && (
                    <Badge variant="secondary" className="text-xs">
                      +{property.amenities.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Owner Info */}
              <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                    {property.owner_name
                      .split(' ')
                      .map(n => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {property.owner_name}
                  </p>
                  <p className="text-xs text-gray-600">Property Owner</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={() => handleContactOwner(property)}>
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  className={cn(
                    'flex-1',
                    pendingApplications.includes(property.id)
                      ? 'bg-yellow-500 hover:bg-yellow-600'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                  )}
                  onClick={() => handleApplyToProperty(property)}
                  disabled={
                    property.available_units === 0 ||
                    pendingApplications.includes(property.id)
                  }>
                  {pendingApplications.includes(property.id)
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
                  className="border-blue-200 text-blue-700 hover:bg-blue-50">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProperties.length === 0 && (
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
          <CardContent className="p-12 text-center">
            <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Properties Found
            </h3>
            <p className="text-gray-600 mb-4">
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
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Application Dialog */}
      <Dialog
        open={showApplicationDialog}
        onOpenChange={setShowApplicationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply to {selectedProperty?.name}</DialogTitle>
            <DialogDescription>
              Submit your application to rent a unit at this property.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <PhilippinePeso className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">Monthly Rent</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                ₱{selectedProperty?.monthly_rent.toLocaleString()}/month
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Background check required</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Employment verification needed</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Security deposit: 2 months rent</span>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowApplicationDialog(false)}>
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
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
              Continue Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
