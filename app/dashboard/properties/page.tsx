'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { cn, formatPropertyType } from '@/lib/utils';
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
  PhilippinePeso,
  Eye,
  Star,
  MoreHorizontal,
  Edit,
  Navigation
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AdminAPI } from '@/lib/api/admin';
import { toast } from 'sonner';
import { DocumentReviewModal } from '@/components/admin/document-review-modal';
import { FileText } from 'lucide-react';

interface Property {
  id: string;
  property_code: string;
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
  is_featured?: boolean;
  is_verified?: boolean;
  documents_submitted?: boolean;
  documents_complete?: boolean;
  documents_approved?: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
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
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithOwner | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isDocumentReviewOpen, setIsDocumentReviewOpen] = useState(false);
  const [reviewingProperty, setReviewingProperty] = useState<PropertyWithOwner | null>(null);

  // Mapbox ref for admin modal
  const adminMapContainerRef = useRef<HTMLDivElement>(null);
  const adminMapRef = useRef<any>(null);

  useEffect(() => {
    loadProperties();
  }, []);

  // Initialize Mapbox for admin modal when property is selected
  useEffect(() => {
    if (!isViewDialogOpen || !selectedProperty?.coordinates) {
      // Cleanup map when dialog closes
      if (adminMapRef.current) {
        adminMapRef.current.remove();
        adminMapRef.current = null;
      }
      return;
    }

    const loadMapbox = async () => {
      try {
        // Wait for container to be in DOM
        if (!adminMapContainerRef.current) {
          console.log('Map container not ready yet');
          return;
        }

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

          await new Promise((resolve) => {
            script.onload = resolve;
          });
        }

        const mapboxgl = (window as any).mapboxgl;
        if (!mapboxgl) {
          console.error('Mapbox GL not loaded');
          return;
        }

        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

        console.log('Initializing map with coordinates:', selectedProperty.coordinates);

        // Initialize map
        const map = new mapboxgl.Map({
          container: adminMapContainerRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [selectedProperty.coordinates.lng, selectedProperty.coordinates.lat],
          zoom: 15
        });

        // Wait for map to load
        map.on('load', () => {
          console.log('Map loaded successfully');
        });

        // Add navigation controls
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Add marker
        new mapboxgl.Marker({ color: '#3B82F6' })
          .setLngLat([selectedProperty.coordinates.lng, selectedProperty.coordinates.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`<strong>${selectedProperty.name}</strong><br/>${selectedProperty.address}`)
          )
          .addTo(map);

        adminMapRef.current = map;
      } catch (error) {
        console.error('Error loading map:', error);
      }
    };

    // Longer delay to ensure dialog animation completes
    const timer = setTimeout(() => {
      loadMapbox();
    }, 300);

    return () => {
      clearTimeout(timer);
      if (adminMapRef.current) {
        adminMapRef.current.remove();
        adminMapRef.current = null;
      }
    };
  }, [isViewDialogOpen, selectedProperty]);

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
      property.property_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Loading properties...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
              Property Oversight
            </h1>
            <p className="text-blue-600/70 mt-1 text-sm sm:text-base">
              Monitor all properties across the platform
            </p>
          </div>
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 self-start sm:self-auto">
            <Building2 className="w-3 h-3 mr-1" />
            {filteredProperties.length} Properties
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{totalProperties}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Total Properties</p>
                </div>
              </div>
            </CardContent>
        </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{totalUnits}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Total Units</p>
                </div>
              </div>
            </CardContent>
        </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <PhilippinePeso className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">₱{totalRevenue.toLocaleString()}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Monthly Revenue</p>
                </div>
              </div>
            </CardContent>
        </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-cyan-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{getOccupancyRate(occupiedUnits, totalUnits)}%</p>
                  <p className="text-xs sm:text-sm text-gray-600">Occupancy Rate</p>
                </div>
              </div>
            </CardContent>
        </Card>
      </div>

        {/* Filters */}
        <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
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

        {/* Properties Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white/70 backdrop-blur-sm border-blue-200/50">
            <TabsTrigger value="all" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              All Properties
              <Badge className="ml-2 bg-blue-100 text-blue-700">{properties.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white">
              Pending Approval
              <Badge className="ml-2 bg-yellow-100 text-yellow-700">
                {properties.filter(p => !p.is_verified).length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
        {/* All Properties Table */}
        <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProperties.map(property => {
                    const occupancyRate = property.total_units > 0
                      ? Math.round((property.occupied_units / property.total_units) * 100)
                      : 0;

                    return (
                      <TableRow key={property.id}>
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="font-mono text-xs bg-blue-50 text-blue-700 border-blue-300">
                                {property.property_code}
                              </Badge>
                            </div>
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              {property.name}
                              {property.is_featured && (
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              )}
                              {property.is_verified && (
                                <Badge className="bg-blue-100 text-blue-700 text-xs">✓ Verified</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              <MapPin className="w-3 h-3 inline mr-1" />
                              {property.address}
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
                          <Badge variant="outline">
                            {formatPropertyType(property.type)}
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
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedProperty(property);
                                  setIsViewDialogOpen(true);
                                }}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleFeatured(property.id, !property.is_featured)}>
                                <Star className="w-4 h-4 mr-2" />
                                {property.is_featured ? 'Remove Featured' : 'Mark as Featured'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
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
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="pending">
            {/* Pending Properties Table */}
            <Card className="bg-white/70 backdrop-blur-sm border-yellow-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  Pending Approval ({properties.filter(p => !p.is_verified).length})
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
                        <TableHead>Units</TableHead>
                        <TableHead>Monthly Rent</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {properties.filter(p => !p.is_verified).map(property => (
                        <TableRow key={property.id}>
                          <TableCell>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="font-mono text-xs bg-blue-50 text-blue-700 border-blue-300">
                                  {property.property_code}
                                </Badge>
                              </div>
                              <div className="font-medium text-gray-900">{property.name}</div>
                              <div className="text-sm text-gray-500">
                                <MapPin className="w-3 h-3 inline mr-1" />
                                {property.address}
                              </div>
                              <div className="flex items-center gap-1 mt-2">
                                {property.documents_submitted && (
                                  <Badge className="text-xs bg-blue-100 text-blue-700 border-0">
                                    <FileText className="w-3 h-3 mr-1" />
                                    Docs Submitted
                                  </Badge>
                                )}
                                {/* {property.documents_complete && (
                                  <Badge className="text-xs bg-purple-100 text-purple-700 border-0">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Docs Complete
                                  </Badge>
                                )}
                                {property.documents_approved && (
                                  <Badge className="text-xs bg-green-100 text-green-700 border-0">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Docs Approved
                                  </Badge>
                                )} */}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {property.owner ? (
                              <div>
                                <div className="font-medium text-gray-900">
                                  {property.owner.first_name} {property.owner.last_name}
                                </div>
                                <div className="text-sm text-gray-500">{property.owner.email}</div>
                              </div>
                            ) : (
                              <span className="text-gray-500">No owner</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{formatPropertyType(property.type)}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{property.total_units} units</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">₱{property.monthly_rent.toLocaleString()}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-500">
                              {new Date(property.created_at).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                onClick={() => {
                                  setSelectedProperty(property);
                                  setIsViewDialogOpen(true);
                                }}>
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              {property.documents_complete && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
                                  onClick={() => {
                                    setReviewingProperty(property);
                                    setIsDocumentReviewOpen(true);
                                  }}>
                                  <FileText className="w-4 h-4 mr-1" />
                                  Review Docs
                                </Button>
                              )}
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleApproveProperty(property.id)}
                                disabled={!property.documents_complete}
                                title={!property.documents_complete ? 'Documents must be submitted and reviewed first' : 'Approve this property'}>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  setSelectedProperty(property);
                                  setIsRejectDialogOpen(true);
                                }}>
                                <AlertCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {properties.filter(p => !p.is_verified).length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        All properties approved!
                      </h3>
                      <p className="text-gray-600">No properties pending approval at this time.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reject Property Dialog */}
        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Reject Property
              </DialogTitle>
              <DialogDescription>
                Provide a reason for rejecting {selectedProperty?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejection-reason">Rejection Reason</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="e.g., Incomplete information, invalid documents, policy violations..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsRejectDialogOpen(false);
                    setRejectionReason('');
                  }}>
                  Cancel
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleRejectProperty}
                  disabled={!rejectionReason.trim()}>
                  Reject Property
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Document Review Modal */}
        {reviewingProperty && (
          <DocumentReviewModal
            propertyId={reviewingProperty.id}
            propertyName={reviewingProperty.name}
            open={isDocumentReviewOpen}
            onOpenChange={setIsDocumentReviewOpen}
            onDocumentsUpdated={loadProperties}
          />
        )}

        {/* View Property Details Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Property Details
          </DialogTitle>
          <DialogDescription>
            Complete information for {selectedProperty?.name}
          </DialogDescription>
        </DialogHeader>
        {selectedProperty && (
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info">Information</TabsTrigger>
              <TabsTrigger value="units">Units</TabsTrigger>
              <TabsTrigger value="owner">Owner</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50">
                <CardHeader>
                  <CardTitle className="text-lg">Property Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Property Name</Label>
                      <p className="font-medium">{selectedProperty.name}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Type</Label>
                      <p className="font-medium">{formatPropertyType(selectedProperty.type)}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-gray-600">Address</Label>
                      <p className="font-medium">{selectedProperty.address}</p>
                      {selectedProperty.city && (
                        <p className="text-sm text-gray-600">
                          {selectedProperty.city}, {selectedProperty.province || ''}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-gray-600">Status</Label>
                      <Badge className={
                        selectedProperty.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : selectedProperty.status === 'inactive'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }>
                        {selectedProperty.status}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-gray-600">Monthly Rent</Label>
                      <p className="font-medium text-lg">₱{selectedProperty.monthly_rent.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Property ID</Label>
                      <p className="font-mono text-xs">{selectedProperty.property_code}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Created Date</Label>
                      <p className="font-medium">{new Date(selectedProperty.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {selectedProperty.description && (
                    <div>
                      <Label className="text-gray-600">Description</Label>
                      <p className="text-sm text-gray-700 mt-1">{selectedProperty.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Unit Statistics */}
              <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Unit Availability
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600 mb-1">Total Units</p>
                      <p className="text-3xl font-bold text-blue-700">{selectedProperty.total_units}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600 mb-1">Occupied</p>
                      <p className="text-3xl font-bold text-green-700">{selectedProperty.occupied_units}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600 mb-1">Available</p>
                      <p className="text-3xl font-bold text-purple-700">{selectedProperty.available_units}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-gray-600">Occupancy Rate</Label>
                      <span className="font-bold text-lg">
                        {Math.round((selectedProperty.occupied_units / selectedProperty.total_units) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all"
                        style={{
                          width: `${(selectedProperty.occupied_units / selectedProperty.total_units) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Property Location Map */}
              {selectedProperty.coordinates && (
                <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      Property Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-gray-600">GPS Coordinates</Label>
                      <p className="text-sm font-mono text-gray-700">
                        {selectedProperty.coordinates.lat.toFixed(6)}, {selectedProperty.coordinates.lng.toFixed(6)}
                      </p>
                    </div>
                    
                    {/* Mapbox Container */}
                    <div 
                      ref={adminMapContainerRef}
                      className="w-full h-[300px] rounded-lg border-2 border-blue-200 overflow-hidden"
                    />

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (selectedProperty.coordinates) {
                          const url = `https://www.google.com/maps?q=${selectedProperty.coordinates.lat},${selectedProperty.coordinates.lng}`;
                          window.open(url, '_blank');
                        }
                      }}
                      className="w-full text-blue-600 border-blue-200 hover:bg-blue-50">
                      <Navigation className="w-4 h-4 mr-2" />
                      Open in Google Maps
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="units" className="space-y-4">
              <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50">
                <CardHeader>
                  <CardTitle className="text-lg">Unit Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Units</p>
                      <p className="text-3xl font-bold text-blue-700">{selectedProperty.total_units}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Occupied</p>
                      <p className="text-3xl font-bold text-green-700">{selectedProperty.occupied_units}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">Available</p>
                      <p className="text-3xl font-bold text-purple-700">{selectedProperty.available_units}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label className="text-gray-600">Occupancy Rate</Label>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-blue-600 h-4 rounded-full"
                          style={{
                            width: `${(selectedProperty.occupied_units / selectedProperty.total_units) * 100}%`
                          }}
                        />
                      </div>
                      <span className="font-bold text-lg">
                        {Math.round((selectedProperty.occupied_units / selectedProperty.total_units) * 100)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="owner" className="space-y-4">
              <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50">
                <CardHeader>
                  <CardTitle className="text-lg">Owner Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedProperty.owner ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-gray-600">Full Name</Label>
                        <p className="font-medium">
                          {selectedProperty.owner.first_name} {selectedProperty.owner.last_name}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Email</Label>
                        <p className="font-medium">{selectedProperty.owner.email}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">No owner information available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50">
                <CardHeader>
                  <CardTitle className="text-lg">Property Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Featured Property</p>
                      <p className="text-sm text-gray-600">Display prominently to tenants</p>
                    </div>
                    <Badge className={selectedProperty.is_featured ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}>
                      {selectedProperty.is_featured ? '⭐ Featured' : 'Not Featured'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Verified Property</p>
                      <p className="text-sm text-gray-600">Documents verified by admin</p>
                    </div>
                    <Badge className={selectedProperty.is_verified ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}>
                      {selectedProperty.is_verified ? '✓ Verified' : 'Not Verified'}
                    </Badge>
                  </div>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      ⭐ <strong>Feature Status:</strong><br/>
                      Featured properties appear at the top of search results and property listings.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
      </div>
    </div>
  );

  async function handleToggleFeatured(propertyId: string, featured: boolean) {
    try {
      const result = await AdminAPI.toggleFeaturedProperty(propertyId, featured);
      if (result.success) {
        toast.success(result.message || `Property ${featured ? 'featured' : 'unfeatured'} successfully`);
        loadProperties();
      } else {
        toast.error(result.message || 'Failed to toggle featured status');
      }
    } catch (error) {
      toast.error('Failed to toggle featured status');
      console.error('Toggle featured error:', error);
    }
  }

  async function handleApproveProperty(propertyId: string) {
    try {
      const result = await AdminAPI.approveProperty(propertyId);
      if (result.success) {
        toast.success('Property approved successfully! Owner will be notified.');
        loadProperties();
      } else {
        toast.error(result.message || 'Failed to approve property');
      }
    } catch (error) {
      toast.error('Failed to approve property');
      console.error('Approve error:', error);
    }
  }

  async function handleRejectProperty() {
    if (!selectedProperty || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      const result = await AdminAPI.rejectProperty(selectedProperty.id, rejectionReason);
      if (result.success) {
        toast.success('Property rejected. Owner will be notified with the reason.');
        setIsRejectDialogOpen(false);
        setRejectionReason('');
        loadProperties();
      } else {
        toast.error(result.message || 'Failed to reject property');
      }
    } catch (error) {
      toast.error('Failed to reject property');
      console.error('Reject error:', error);
    }
  }
}
