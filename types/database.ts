export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          phone: string
          role: "owner" | "tenant"
          avatar_url?: string
          is_verified: boolean
          created_at: string
          updated_at: string
          last_login?: string
          // Owner specific fields
          company_name?: string
          business_license?: string
          // Tenant specific fields
          emergency_contact_name?: string
          emergency_contact_phone?: string
          emergency_contact_relationship?: string
        }
        Insert: {
          id?: string
          email: string
          first_name: string
          last_name: string
          phone: string
          role: "owner" | "tenant"
          avatar_url?: string
          is_verified?: boolean
          created_at?: string
          updated_at?: string
          last_login?: string
          company_name?: string
          business_license?: string
          emergency_contact_name?: string
          emergency_contact_phone?: string
          emergency_contact_relationship?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          phone?: string
          role?: "owner" | "tenant"
          avatar_url?: string
          is_verified?: boolean
          created_at?: string
          updated_at?: string
          last_login?: string
          company_name?: string
          business_license?: string
          emergency_contact_name?: string
          emergency_contact_phone?: string
          emergency_contact_relationship?: string
        }
      }
      properties: {
        Row: {
          id: string
          owner_id: string
          name: string
          type: "residential" | "commercial" | "dormitory"
          address: string
          total_units: number
          occupied_units: number
          monthly_rent: number
          status: "active" | "maintenance" | "inactive"
          description?: string
          amenities: string[]
          images: string[]
          thumbnail: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          type: "residential" | "commercial" | "dormitory"
          address: string
          total_units: number
          occupied_units?: number
          monthly_rent: number
          status?: "active" | "maintenance" | "inactive"
          description?: string
          amenities?: string[]
          images?: string[]
          thumbnail?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          type?: "residential" | "commercial" | "dormitory"
          address?: string
          total_units?: number
          occupied_units?: number
          monthly_rent?: number
          status?: "active" | "maintenance" | "inactive"
          description?: string
          amenities?: string[]
          images?: string[]
          thumbnail?: string
          created_at?: string
          updated_at?: string
        }
      }
      tenants: {
        Row: {
          id: string
          user_id: string
          property_id: string
          unit_number: string
          lease_start: string
          lease_end: string
          monthly_rent: number
          deposit: number
          status: "active" | "pending" | "terminated"
          documents: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          property_id: string
          unit_number: string
          lease_start: string
          lease_end: string
          monthly_rent: number
          deposit: number
          status?: "active" | "pending" | "terminated"
          documents?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          property_id?: string
          unit_number?: string
          lease_start?: string
          lease_end?: string
          monthly_rent?: number
          deposit?: number
          status?: "active" | "pending" | "terminated"
          documents?: string[]
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: "owner" | "tenant"
      property_type: "residential" | "commercial" | "dormitory"
      property_status: "active" | "maintenance" | "inactive"
      tenant_status: "active" | "pending" | "terminated"
    }
  }
}
