"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Property, Tenant } from "@/types/property"
import { ArrowLeft, Edit, MapPin, Building, Users, DollarSign, Calendar, Phone, Mail, User } from "lucide-react"
import { useState } from "react"

interface PropertyDetailsProps {
  property: Property
  tenants: Tenant[]
  onBack: () => void
  onEdit: () => void
}

export function PropertyDetails({ property, tenants, onBack, onEdit }: PropertyDetailsProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const occupancyRate = (property.occupiedUnits / property.totalUnits) * 100
  const totalMonthlyIncome = tenants.reduce((sum, tenant) => sum + tenant.monthlyRent, 0)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700"
      case "maintenance":
        return "bg-yellow-100 text-yellow-700"
      case "inactive":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "residential":
        return "bg-blue-100 text-blue-700"
      case "commercial":
        return "bg-purple-100 text-purple-700"
      case "dormitory":
        return "bg-orange-100 text-orange-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getTenantStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700"
      case "pending":
        return "bg-yellow-100 text-yellow-700"
      case "terminated":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <div className="min-h-screen bg-property-background">
      {/* Header */}
      <div className="bg-property-primary shadow-sm">
        <div className="flex items-center justify-between p-4 pt-12">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-white hover:bg-white/10 p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-white text-lg font-semibold">Property Details</h1>
          </div>
          <Button onClick={onEdit} className="bg-property-action hover:bg-property-action/90 text-white" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-20 space-y-6">
        {/* Property Header */}
        <Card className="bg-property-card shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-property-text-primary mb-2">{property.name}</h2>
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={getStatusColor(property.status)}>{property.status}</Badge>
                  <Badge className={getTypeColor(property.type)}>{property.type}</Badge>
                </div>
                <div className="flex items-center gap-2 text-property-text-secondary">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{property.address}</span>
                </div>
              </div>
            </div>

            {/* Property Images Gallery */}
            <div className="mb-4">
              {/* Main Image */}
              <div className="relative mb-3">
                <img
                  src={property.images[selectedImageIndex] || property.thumbnail}
                  alt={`${property.name} - Image ${selectedImageIndex + 1}`}
                  className="w-full h-64 object-cover rounded-lg bg-gray-100"
                />
                {property.images.length > 1 && (
                  <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                    {selectedImageIndex + 1} / {property.images.length}
                  </div>
                )}
              </div>

              {/* Image Thumbnails */}
              {property.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {property.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-12 rounded border-2 overflow-hidden ${
                        selectedImageIndex === index
                          ? "border-property-action"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            {property.description && (
              <div className="mb-4">
                <h3 className="text-property-text-primary font-semibold mb-2">Description</h3>
                <p className="text-property-text-secondary text-sm">{property.description}</p>
              </div>
            )}

            {/* Amenities */}
            {property.amenities.length > 0 && (
              <div>
                <h3 className="text-property-text-primary font-semibold mb-2">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-property-background text-property-text-secondary"
                    >
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-property-card shadow-sm border border-gray-100">
            <CardContent className="p-4 text-center">
              <Building className="w-8 h-8 text-property-action mx-auto mb-2" />
              <div className="text-2xl font-bold text-property-text-primary mb-1">
                {property.occupiedUnits}/{property.totalUnits}
              </div>
              <p className="text-property-text-secondary text-xs">Units Occupied</p>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-property-action h-2 rounded-full" style={{ width: `${occupancyRate}%` }} />
                </div>
                <p className="text-xs text-property-text-secondary mt-1">{occupancyRate.toFixed(1)}% Occupancy</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-property-card shadow-sm border border-gray-100">
            <CardContent className="p-4 text-center">
              <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-property-text-primary mb-1">
                ₱{totalMonthlyIncome.toLocaleString()}
              </div>
              <p className="text-property-text-secondary text-xs">Monthly Income</p>
              <p className="text-xs text-property-text-secondary mt-1">
                Base Rate: ₱{property.monthlyRent.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tenants */}
        <Card className="bg-property-card shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-property-text-primary flex items-center gap-2">
              <Users className="w-5 h-5" />
              Tenants ({tenants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tenants.length > 0 ? (
              <div className="space-y-4">
                {tenants.map((tenant) => (
                  <div key={tenant.id} className="flex items-center gap-4 p-3 bg-property-background rounded-lg">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src="/placeholder.svg?height=48&width=48" />
                      <AvatarFallback className="bg-property-secondary text-white">
                        {tenant.firstName[0]}
                        {tenant.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-property-text-primary font-medium">
                          {tenant.firstName} {tenant.lastName}
                        </h4>
                        <Badge className={getTenantStatusColor(tenant.status)}>{tenant.status}</Badge>
                      </div>
                      <div className="text-sm text-property-text-secondary space-y-1">
                        <div className="flex items-center gap-2">
                          <Building className="w-3 h-3" />
                          <span>Unit {tenant.unitNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          <span>{tenant.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          <span>{tenant.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          <span>
                            Lease: {new Date(tenant.leaseStart).toLocaleDateString()} -{" "}
                            {new Date(tenant.leaseEnd).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-property-action">
                        ₱{tenant.monthlyRent.toLocaleString()}
                      </div>
                      <div className="text-xs text-property-text-secondary">per month</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-property-text-secondary mx-auto mb-3" />
                <p className="text-property-text-secondary">No tenants registered yet</p>
                <Button className="mt-3 bg-property-action hover:bg-property-action/90 text-white">Add Tenant</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Property Information */}
        <Card className="bg-property-card shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-property-text-primary">Property Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-property-text-secondary">Created:</span>
              <span className="text-property-text-primary font-medium">
                {new Date(property.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-property-text-secondary">Last Updated:</span>
              <span className="text-property-text-primary font-medium">
                {new Date(property.updatedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-property-text-secondary">Property ID:</span>
              <span className="text-property-text-primary font-medium font-mono">{property.id}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
