"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Save } from "lucide-react"
import type { Property } from "@/types/property"
import { ImageUpload } from "@/components/image-upload"

interface PropertyFormProps {
  onBack: () => void
  onSubmit: (data: any) => void
  title: string
  initialData?: Property
}

export function PropertyForm({ onBack, onSubmit, title, initialData }: PropertyFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    type: initialData?.type || "residential",
    address: initialData?.address || "",
    totalUnits: initialData?.totalUnits || 0,
    occupiedUnits: initialData?.occupiedUnits || 0,
    monthlyRent: initialData?.monthlyRent || 0,
    status: initialData?.status || "active",
    description: initialData?.description || "",
    amenities: initialData?.amenities || [],
    images: initialData?.images || [],
    thumbnail: initialData?.thumbnail || "",
  })

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialData?.amenities || [])

  const availableAmenities = [
    "WiFi",
    "Parking",
    "Security",
    "Elevator",
    "Swimming Pool",
    "Gym",
    "Laundry",
    "Cafeteria",
    "Study Areas",
    "Playground",
    "Conference Rooms",
    "24/7 Security",
    "CCTV",
    "Generator",
  ]

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    if (checked) {
      setSelectedAmenities((prev) => [...prev, amenity])
    } else {
      setSelectedAmenities((prev) => prev.filter((a) => a !== amenity))
    }
  }

  const handleImagesChange = (images: string[], thumbnail: string) => {
    setFormData((prev) => ({
      ...prev,
      images,
      thumbnail,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const defaultThumbnail =
      formData.thumbnail ||
      (formData.type === "residential"
        ? "/placeholder.svg?height=200&width=300&text=Residential+Property"
        : formData.type === "commercial"
          ? "/placeholder.svg?height=200&width=300&text=Commercial+Property"
          : formData.type === "dormitory"
            ? "/placeholder.svg?height=200&width=300&text=Dormitory+Property"
            : "/placeholder.svg?height=200&width=300&text=Property+Image")

    onSubmit({
      ...formData,
      amenities: selectedAmenities,
      totalUnits: Number(formData.totalUnits),
      occupiedUnits: Number(formData.occupiedUnits),
      monthlyRent: Number(formData.monthlyRent),
      images: formData.images.length > 0 ? formData.images : [defaultThumbnail],
      thumbnail: formData.thumbnail || defaultThumbnail,
    })
  }

  return (
    <div className="min-h-screen bg-property-background">
      {/* Header */}
      <div className="bg-property-primary shadow-sm">
        <div className="flex items-center gap-3 p-4 pt-12">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-white hover:bg-white/10 p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-white text-lg font-semibold">{title}</h1>
        </div>
      </div>

      {/* Form */}
      <div className="p-4 pb-20">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="bg-property-card shadow-sm border border-gray-100">
            <CardHeader>
              <CardTitle className="text-property-text-primary">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-property-text-primary">
                  Property Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter property name"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="type" className="text-property-text-primary">
                  Property Type
                </Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="dormitory">Dormitory</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="address" className="text-property-text-primary">
                  Address
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Enter complete address"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="status" className="text-property-text-primary">
                  Status
                </Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Under Maintenance</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Unit Information */}
          <Card className="bg-property-card shadow-sm border border-gray-100">
            <CardHeader>
              <CardTitle className="text-property-text-primary">Unit Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalUnits" className="text-property-text-primary">
                    Total Units
                  </Label>
                  <Input
                    id="totalUnits"
                    type="number"
                    value={formData.totalUnits}
                    onChange={(e) => handleInputChange("totalUnits", e.target.value)}
                    placeholder="0"
                    min="1"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="occupiedUnits" className="text-property-text-primary">
                    Occupied Units
                  </Label>
                  <Input
                    id="occupiedUnits"
                    type="number"
                    value={formData.occupiedUnits}
                    onChange={(e) => handleInputChange("occupiedUnits", e.target.value)}
                    placeholder="0"
                    min="0"
                    max={formData.totalUnits}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="monthlyRent" className="text-property-text-primary">
                  Monthly Rent (₱)
                </Label>
                <Input
                  id="monthlyRent"
                  type="number"
                  value={formData.monthlyRent}
                  onChange={(e) => handleInputChange("monthlyRent", e.target.value)}
                  placeholder="0"
                  min="0"
                  required
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="bg-property-card shadow-sm border border-gray-100">
            <CardHeader>
              <CardTitle className="text-property-text-primary">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe your property..."
                rows={4}
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card className="bg-property-card shadow-sm border border-gray-100">
            <CardHeader>
              <CardTitle className="text-property-text-primary">Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {availableAmenities.map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox
                      id={amenity}
                      checked={selectedAmenities.includes(amenity)}
                      onCheckedChange={(checked) => handleAmenityChange(amenity, checked as boolean)}
                    />
                    <Label htmlFor={amenity} className="text-sm text-property-text-primary cursor-pointer">
                      {amenity}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Property Images */}
          <Card className="bg-property-card shadow-sm border border-gray-100">
            <CardHeader>
              <CardTitle className="text-property-text-primary">Property Images</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                images={formData.images}
                thumbnail={formData.thumbnail}
                onImagesChange={handleImagesChange}
                maxImages={8}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-property-action hover:bg-property-action/90 text-white">
              <Save className="w-4 h-4 mr-2" />
              {initialData ? "Update Property" : "Add Property"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
