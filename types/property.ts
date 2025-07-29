export interface Property {
  id: string
  name: string
  type: "residential" | "commercial" | "dormitory"
  address: string
  totalUnits: number
  occupiedUnits: number
  monthlyRent: number
  status: "active" | "maintenance" | "inactive"
  description: string
  amenities: string[]
  images: string[]
  thumbnail: string // Main thumbnail image
  createdAt: string
  updatedAt: string
}

export interface Tenant {
  id: string
  propertyId: string
  unitNumber: string
  firstName: string
  lastName: string
  email: string
  phone: string
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }
  leaseStart: string
  leaseEnd: string
  monthlyRent: number
  deposit: number
  status: "active" | "pending" | "terminated"
  documents: string[]
  createdAt: string
}

export interface LeaseAgreement {
  id: string
  propertyId: string
  tenantId: string
  unitNumber: string
  startDate: string
  endDate: string
  monthlyRent: number
  securityDeposit: number
  terms: string[]
  status: "active" | "expired" | "terminated"
  signedDate: string
  documents: string[]
}
