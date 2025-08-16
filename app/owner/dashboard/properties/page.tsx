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
  DollarSign,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  MoreVertical
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-white to-blue-50/50 shadow-sm border-b border-blue-100">
        <div className="px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
                Properties
              </h1>
              <p className="text-blue-600/80 font-medium">
                Manage your property portfolio
              </p>
            </div>
            <Button
              onClick={() => router.push('/owner/dashboard/properties/new')}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
              <Plus className="w-4 h-4 mr-2" />
              Add Property
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        {/* Properties Grid */}
        {filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProperties.map(property => (
              <Card
                key={property.id}
                className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-200 hover:scale-[1.02] overflow-hidden">
                {/* Property Image */}
                <div className="relative h-48 bg-gradient-to-br from-blue-50 to-blue-100">
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
                      <Building className="w-16 h-16" />
                    </div>
                  )}

                  {/* Status Badge Overlay */}
                  <div className="absolute top-3 left-3">
                    {getStatusBadge(property.status)}
                  </div>

                  {/* Quick Actions Overlay */}
                  <div className="absolute top-3 right-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 bg-white/80 backdrop-blur-sm hover:bg-white/90 border border-white/20">
                          <MoreVertical className="w-4 h-4" />
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
                  <div className="absolute bottom-3 left-3">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                      <span className="text-xs font-semibold text-gray-800">
                        {Math.round(getOccupancyRate(property))}% occupied
                      </span>
                    </div>
                  </div>
                </div>

                <CardHeader className="pb-2">
                  <div className="space-y-2">
                    <CardTitle className="text-lg font-bold text-gray-900">
                      {property.name}
                    </CardTitle>
                    <div className="flex items-center text-gray-600 text-sm">
                      <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                      <span className="truncate">
                        {property.address}, {property.city}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">
                        {property.type}
                      </span>
                      <span className="text-lg font-bold text-blue-600">
                        {formatCurrency(property.monthly_rent)}
                        <span className="text-sm font-normal text-gray-500">
                          /month
                        </span>
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="space-y-3">
                    {/* Unit Information */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" />
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
                          .slice(0, 3)
                          .map((amenity, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5">
                              {amenity}
                            </Badge>
                          ))}
                        {property.amenities.length > 3 && (
                          <Badge
                            variant="secondary"
                            className="bg-gray-50 text-gray-600 text-xs px-2 py-0.5">
                            +{property.amenities.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        onClick={() =>
                          router.push(
                            `/owner/dashboard/properties/${property.id}`
                          )
                        }>
                        <Eye className="w-4 h-4 mr-2" />
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
            <CardContent className="text-center py-12">
              <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || filterStatus !== 'all'
                  ? 'No properties found'
                  : 'No properties yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Start by adding your first property to the portfolio.'}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <Button
                  onClick={() => router.push('/owner/dashboard/properties/new')}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
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
