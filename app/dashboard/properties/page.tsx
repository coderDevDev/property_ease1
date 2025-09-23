'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Building2,
  Search,
  MapPin,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  PhilippinePeso
} from 'lucide-react';
import { AdminAPI } from '@/lib/api/admin';
import { toast } from 'sonner';

interface Property {
  id: string;
  name: string;
  address: string;
  city?: string;
  province?: string;
  postal_code?: string;
  type: string;
  status: 'active' | 'inactive' | 'maintenance';
  total_units: number;
  occupied_units: number;
  available_units: number;
  monthly_rent: number;
  created_at: string;
  owner_id: string;
  description?: string;
  amenities?: string[];
}

interface PropertyWithOwner extends Property {
  owner: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<PropertyWithOwner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadProperties();
  }, [statusFilter]);

  const loadProperties = async () => {
    try {
      setIsLoading(true);
      const statusParam = statusFilter !== 'all' ? statusFilter : undefined;

      const result = await AdminAPI.getAllProperties(statusParam);
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

  const filteredProperties = properties.filter(property => {
    const matchesSearch =
      property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.owner?.first_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      property.owner?.last_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || property.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'maintenance':
        return <Clock className="w-4 h-4" />;
      case 'inactive':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Building2 className="w-4 h-4" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'inactive':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getOccupancyRate = (occupied: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((occupied / total) * 100);
  };

  const getOccupancyColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const totalProperties = properties.length;
  const activeProperties = properties.filter(p => p.status === 'active').length;
  const maintenanceProperties = properties.filter(
    p => p.status === 'maintenance'
  ).length;
  const totalUnits = properties.reduce((sum, p) => sum + p.total_units, 0);
  const occupiedUnits = properties.reduce(
    (sum, p) => sum + p.occupied_units,
    0
  );
  const totalRevenue = properties.reduce(
    (sum, p) => sum + p.monthly_rent * p.occupied_units,
    0
  );

  return (
    <div className="p-6 space-y-6 ml-72">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Property Oversight
          </h1>
          <p className="text-gray-600">
            Monitor all properties across the platform
          </p>
        </div>
        <Badge variant="outline" className="border-blue-200 text-blue-700">
          {filteredProperties.length} Properties
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Properties
            </CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {totalProperties}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {activeProperties} active, {maintenanceProperties} maintenance
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Units
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalUnits}</div>
            <p className="text-xs text-gray-600 mt-1">
              {occupiedUnits} occupied (
              {getOccupancyRate(occupiedUnits, totalUnits)}%)
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Monthly Revenue
            </CardTitle>
            <PhilippinePeso className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ₱{totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              From {occupiedUnits} occupied units
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Occupancy Rate
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getOccupancyColor(
                getOccupancyRate(occupiedUnits, totalUnits)
              )}`}>
              {getOccupancyRate(occupiedUnits, totalUnits)}%
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {totalUnits - occupiedUnits} units available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Properties</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search by name, address, or owner..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">Filter by Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type-filter">Filter by Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="dormitory">Dormitory</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Properties ({filteredProperties.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Occupancy</TableHead>
                  <TableHead>Monthly Rent</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProperties.map(property => {
                  const occupancyRate = getOccupancyRate(
                    property.occupied_units,
                    property.total_units
                  );

                  return (
                    <TableRow key={property.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">
                            {property.name}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {property.address}
                            {property.city && `, ${property.city}`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {property.owner ? (
                          <div>
                            <div className="font-medium text-gray-900">
                              {property.owner.first_name}{' '}
                              {property.owner.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {property.owner.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">No owner</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {property.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${getStatusBadgeColor(
                            property.status
                          )} capitalize`}>
                          {getStatusIcon(property.status)}
                          <span className="ml-1">{property.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {property.total_units} total
                          </div>
                          <div className="text-gray-500">
                            {property.occupied_units} occupied,{' '}
                            {property.available_units} available
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className={`font-medium ${getOccupancyColor(
                            occupancyRate
                          )}`}>
                          {occupancyRate}%
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className={`h-2 rounded-full ${
                              occupancyRate >= 90
                                ? 'bg-green-500'
                                : occupancyRate >= 70
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${occupancyRate}%` }}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          ₱{property.monthly_rent.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">per unit</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(property.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {filteredProperties.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No properties found
              </h3>
              <p className="text-gray-600">
                {searchTerm
                  ? 'Try adjusting your search criteria.'
                  : 'No properties match the current filters.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
