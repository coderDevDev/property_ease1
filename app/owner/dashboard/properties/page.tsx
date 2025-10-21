'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import {
  Building,
  MapPin,
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  AlertCircle,
  CheckCircle,
  Clock,
  Star
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { PropertiesAPI } from '@/lib/api/properties';
import { toast } from 'sonner';

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  type: string;
  monthly_rent: number;
  total_units: number;
  occupied_units: number;
  status: string;
  description?: string;
  amenities?: string[];
  images?: string[];
  thumbnail?: string;
  created_at: string;
  is_verified?: boolean;
  rejection_reason?: string;
  is_featured?: boolean;
}

export default function PropertiesPage() {
  const { authState } = useAuth();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const loadProperties = async () => {
      if (!authState.user?.id) return;

      try {
        setIsLoading(true);
        const result = await PropertiesAPI.getProperties(authState.user.id);

        if (result.success) {
          setProperties(result.data);
        } else {
          toast.error('Failed to load properties');
        }
      } catch (error) {
        console.error('Failed to load properties:', error);
        toast.error('Failed to load properties');
      } finally {
        setIsLoading(false);
      }
    };

    loadProperties();
  }, [authState.user?.id]);

  const filteredProperties = properties.filter(property => {
    const matchesSearch =
      property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === 'all' || property.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

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

  const getOccupancyRate = (property: Property) => {
    return property.total_units > 0
      ? (property.occupied_units / property.total_units) * 100
      : 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getApprovalBadge = (property: Property) => {
    // Rejected with reason
    if (!property.is_verified && property.rejection_reason) {
      return (
        <Badge className="bg-red-100 text-red-700 border-0 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Rejected
        </Badge>
      );
    }
    
    // Pending approval
    if (!property.is_verified) {
      return (
        <Badge className="bg-yellow-100 text-yellow-700 border-0 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Pending
        </Badge>
      );
    }
    
    // Verified
    return (
      <Badge className="bg-green-100 text-green-700 border-0 flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        Verified
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium text-sm sm:text-base">
            Loading properties...
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
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
                Properties
              </h1>
              <p className="text-blue-600/80 font-medium text-sm sm:text-base">
                Manage your property portfolio
              </p>
            </div>
            <Button
              onClick={() => router.push('/owner/dashboard/properties/new')}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base">
              <Plus className="w-4 h-4 mr-2" />
              Add Property
            </Button>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 lg:p-6">
        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-sm sm:text-base"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-sm sm:text-base">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        {/* Properties Grid */}
        {filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredProperties.map(property => (
              <Card
                key={property.id}
                className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-200 hover:scale-[1.02] overflow-hidden">
                {/* Property Image */}
                <div className="relative h-40 sm:h-48 bg-gradient-to-br from-blue-50 to-blue-100">
                  {property.thumbnail ||
                  (property.images && property.images.length > 0) ? (
                    <img
                      src={property.thumbnail || property.images?.[0]}
                      alt={property.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      onError={e => {
                        // Fallback to placeholder if image fails to load
                        e.currentTarget.src =
                          '/placeholder.svg?height=192&width=300';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-blue-400">
                      <Building className="w-12 h-12 sm:w-16 sm:h-16" />
                    </div>
                  )}

                  {/* Status Badge Overlay */}
                  <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-col gap-1.5">
                    {getStatusBadge(property.status)}
                    {getApprovalBadge(property)}
                    {property.is_featured && (
                      <Badge className="bg-yellow-100 text-yellow-700 border-0 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-700" />
                        Featured
                      </Badge>
                    )}
                  </div>

                  {/* Quick Actions Overlay */}
                  <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0 bg-white/80 backdrop-blur-sm hover:bg-white/90 border border-white/20">
                          <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              `/owner/dashboard/properties/${property.id}`
                            )
                          }>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              `/owner/dashboard/properties/${property.id}/edit`
                            )
                          }>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Property
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Property
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Occupancy Rate Indicator */}
                  <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full px-2 sm:px-3 py-1">
                      <span className="text-xs font-semibold text-gray-800">
                        {Math.round(getOccupancyRate(property))}% occupied
                      </span>
                    </div>
                  </div>
                </div>

                <CardHeader className="pb-2 p-3 sm:p-6">
                  <div className="space-y-2">
                    <CardTitle className="text-base sm:text-lg font-bold text-gray-900">
                      {property.name}
                    </CardTitle>
                    <div className="flex items-center text-gray-600 text-xs sm:text-sm">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                      <span className="truncate">
                        {property.address}, {property.city}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-gray-600 capitalize">
                        {property.type}
                      </span>
                      <span className="text-sm sm:text-lg font-bold text-blue-600">
                        {formatCurrency(property.monthly_rent)}
                        <span className="text-xs sm:text-sm font-normal text-gray-500">
                          /month
                        </span>
                      </span>
                    </div>
                  </div>
                </CardHeader>

                {/* Rejection Reason Alert */}
                {!property.is_verified && property.rejection_reason && (
                  <div className="px-3 sm:px-6 pb-2">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-red-900 mb-1">Property Rejected</p>
                          <p className="text-xs text-red-700">{property.rejection_reason}</p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 h-7 text-xs border-red-300 text-red-700 hover:bg-red-100"
                            onClick={() => router.push(`/owner/dashboard/properties/${property.id}/edit`)}>
                            <Edit className="w-3 h-3 mr-1" />
                            Fix and Resubmit
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pending Approval Info */}
                {!property.is_verified && !property.rejection_reason && (
                  <div className="px-3 sm:px-6 pb-2">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-yellow-900 mb-1">Pending Approval</p>
                          <p className="text-xs text-yellow-700">Your property is under review by the admin team. You'll be notified once it's approved.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <CardContent className="pt-2 p-3 sm:p-6">
                  <div className="space-y-3">
                    {/* Unit Information */}
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                        <span className="text-gray-600">Units</span>
                      </div>
                      <span className="font-medium text-gray-900">
                        {property.occupied_units}/{property.total_units}{' '}
                        occupied
                      </span>
                    </div>

                    {/* Occupancy Rate Bar */}
                    <div className="space-y-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            getOccupancyRate(property) >= 80
                              ? 'bg-gradient-to-r from-green-400 to-green-500'
                              : getOccupancyRate(property) >= 50
                              ? 'bg-gradient-to-r from-blue-400 to-blue-500'
                              : 'bg-gradient-to-r from-orange-400 to-orange-500'
                          }`}
                          style={{ width: `${getOccupancyRate(property)}%` }}
                        />
                      </div>
                    </div>

                    {/* Amenities Preview */}
                    {property.amenities && property.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {property.amenities
                          .slice(0, 2)
                          .map((amenity, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5">
                              {amenity}
                            </Badge>
                          ))}
                        {property.amenities.length > 2 && (
                          <Badge
                            variant="secondary"
                            className="bg-gray-50 text-gray-600 text-xs px-2 py-0.5">
                            +{property.amenities.length - 2} more
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-colors text-xs sm:text-sm"
                        onClick={() =>
                          router.push(
                            `/owner/dashboard/properties/${property.id}`
                          )
                        }>
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
            <CardContent className="text-center py-8 sm:py-12">
              <Building className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || filterStatus !== 'all'
                  ? 'No properties found'
                  : 'No properties yet'}
              </h3>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Start by adding your first property to the portfolio.'}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <Button
                  onClick={() => router.push('/owner/dashboard/properties/new')}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm sm:text-base">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Property
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
