export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  role: "owner" | "tenant"
  avatar?: string
  isVerified: boolean
  createdAt: string
  lastLogin?: string
  // Owner specific fields
  companyName?: string
  businessLicense?: string
  // Tenant specific fields
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface LoginCredentials {
  email: string
  password: string
  role: "owner" | "tenant"
}

export interface RegisterData {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  phone: string
  role: "owner" | "tenant"
  // Owner specific
  companyName?: string
  businessLicense?: string
  // Tenant specific
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelationship?: string
}

export interface ForgotPasswordData {
  email: string
  role: "owner" | "tenant"
}
