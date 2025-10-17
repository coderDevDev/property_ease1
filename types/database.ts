export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone: string;
          role: 'owner' | 'tenant' | 'admin';
          avatar_url?: string;
          is_verified: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          last_login?: string;
          // Owner specific fields
          company_name?: string;
          business_license?: string;
          // Tenant specific fields
          emergency_contact_name?: string;
          emergency_contact_phone?: string;
          emergency_contact_relationship?: string;
          // Admin specific fields
          permissions?: string[];
        };
        Insert: {
          id?: string;
          email: string;
          first_name: string;
          last_name: string;
          phone: string;
          role: 'owner' | 'tenant' | 'admin';
          avatar_url?: string;
          is_verified?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          last_login?: string;
          company_name?: string;
          business_license?: string;
          emergency_contact_name?: string;
          emergency_contact_phone?: string;
          emergency_contact_relationship?: string;
          permissions?: string[];
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          phone?: string;
          role?: 'owner' | 'tenant' | 'admin';
          avatar_url?: string;
          is_verified?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          last_login?: string;
          company_name?: string;
          business_license?: string;
          emergency_contact_name?: string;
          emergency_contact_phone?: string;
          emergency_contact_relationship?: string;
          permissions?: string[];
        };
      };
      properties: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          type: 'residential' | 'commercial' | 'dormitory';
          address: string;
          city: string;
          province: string;
          postal_code: string;
          coordinates?: {
            lat: number;
            lng: number;
          };
          total_units: number;
          occupied_units: number;
          monthly_rent: number;
          status: 'active' | 'maintenance' | 'inactive';
          description?: string;
          amenities: string[];
          images: string[];
          thumbnail?: string;
          floor_plan?: string;
          property_rules?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          type: 'residential' | 'commercial' | 'dormitory';
          address: string;
          city: string;
          province: string;
          postal_code: string;
          coordinates?: {
            lat: number;
            lng: number;
          };
          total_units: number;
          occupied_units?: number;
          monthly_rent: number;
          status?: 'active' | 'maintenance' | 'inactive';
          description?: string;
          amenities?: string[];
          images?: string[];
          thumbnail?: string;
          floor_plan?: string;
          property_rules?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          type?: 'residential' | 'commercial' | 'dormitory';
          address?: string;
          city?: string;
          province?: string;
          postal_code?: string;
          coordinates?: {
            lat: number;
            lng: number;
          };
          total_units?: number;
          occupied_units?: number;
          monthly_rent?: number;
          status?: 'active' | 'maintenance' | 'inactive';
          description?: string;
          amenities?: string[];
          images?: string[];
          thumbnail?: string;
          floor_plan?: string;
          property_rules?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      tenants: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          unit_number: string;
          lease_start: string;
          lease_end: string;
          monthly_rent: number;
          deposit: number;
          security_deposit: number;
          status: 'active' | 'pending' | 'terminated' | 'expired';
          documents: string[];
          lease_agreement_url?: string;
          move_in_date?: string;
          move_out_date?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          property_id: string;
          unit_number: string;
          lease_start: string;
          lease_end: string;
          monthly_rent: number;
          deposit: number;
          security_deposit: number;
          status?: 'active' | 'pending' | 'terminated' | 'expired';
          documents?: string[];
          lease_agreement_url?: string;
          move_in_date?: string;
          move_out_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          property_id?: string;
          unit_number?: string;
          lease_start?: string;
          lease_end?: string;
          monthly_rent?: number;
          deposit?: number;
          security_deposit?: number;
          status?: 'active' | 'pending' | 'terminated' | 'expired';
          documents?: string[];
          lease_agreement_url?: string;
          move_in_date?: string;
          move_out_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          tenant_id: string;
          property_id: string;
          amount: number;
          payment_type:
            | 'rent'
            | 'deposit'
            | 'security_deposit'
            | 'utility'
            | 'penalty'
            | 'other';
          payment_method: 'gcash' | 'maya' | 'bank_transfer' | 'check';
          payment_status:
            | 'pending'
            | 'paid'
            | 'failed'
            | 'refunded'
            | 'partial';
          due_date: string;
          paid_date?: string;
          late_fee?: number;
          reference_number?: string;
          receipt_url?: string;
          notes?: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          property_id: string;
          amount: number;
          payment_type:
            | 'rent'
            | 'deposit'
            | 'security_deposit'
            | 'utility'
            | 'penalty'
            | 'other';
          payment_method: 'gcash' | 'maya' | 'bank_transfer' | 'check';
          payment_status?:
            | 'pending'
            | 'paid'
            | 'failed'
            | 'refunded'
            | 'partial';
          due_date: string;
          paid_date?: string;
          late_fee?: number;
          reference_number?: string;
          receipt_url?: string;
          notes?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          property_id?: string;
          amount?: number;
          payment_type?:
            | 'rent'
            | 'deposit'
            | 'security_deposit'
            | 'utility'
            | 'penalty'
            | 'other';
          payment_method?:
            | 'gcash'
            | 'maya'
            | 'bank_transfer'
            | 'cash'
            | 'check';
          payment_status?:
            | 'pending'
            | 'paid'
            | 'failed'
            | 'refunded'
            | 'partial';
          due_date?: string;
          paid_date?: string;
          late_fee?: number;
          reference_number?: string;
          receipt_url?: string;
          notes?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      maintenance_requests: {
        Row: {
          id: string;
          tenant_id: string;
          property_id: string;
          title: string;
          description: string;
          category:
            | 'plumbing'
            | 'electrical'
            | 'hvac'
            | 'appliance'
            | 'pest_control'
            | 'cleaning'
            | 'security'
            | 'other';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          status:
            | 'pending'
            | 'in_progress'
            | 'completed'
            | 'cancelled'
            | 'rejected';
          images: string[];
          estimated_cost?: number;
          actual_cost?: number;
          assigned_to?: string;
          scheduled_date?: string;
          completed_date?: string;
          tenant_notes?: string;
          owner_notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          property_id: string;
          title: string;
          description: string;
          category:
            | 'plumbing'
            | 'electrical'
            | 'hvac'
            | 'appliance'
            | 'pest_control'
            | 'cleaning'
            | 'security'
            | 'other';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          status?:
            | 'pending'
            | 'in_progress'
            | 'completed'
            | 'cancelled'
            | 'rejected';
          images?: string[];
          estimated_cost?: number;
          actual_cost?: number;
          assigned_to?: string;
          scheduled_date?: string;
          completed_date?: string;
          tenant_notes?: string;
          owner_notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          property_id?: string;
          title?: string;
          description?: string;
          category?:
            | 'plumbing'
            | 'electrical'
            | 'hvac'
            | 'appliance'
            | 'pest_control'
            | 'cleaning'
            | 'security'
            | 'other';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          status?:
            | 'pending'
            | 'in_progress'
            | 'completed'
            | 'cancelled'
            | 'rejected';
          images?: string[];
          estimated_cost?: number;
          actual_cost?: number;
          assigned_to?: string;
          scheduled_date?: string;
          completed_date?: string;
          tenant_notes?: string;
          owner_notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          recipient_id: string;
          property_id?: string;
          subject?: string;
          content: string;
          message_type: 'direct' | 'maintenance' | 'payment' | 'general';
          is_read: boolean;
          attachments: string[];
          parent_message_id?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          recipient_id: string;
          property_id?: string;
          subject?: string;
          content: string;
          message_type?: 'direct' | 'maintenance' | 'payment' | 'general';
          is_read?: boolean;
          attachments?: string[];
          parent_message_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          recipient_id?: string;
          property_id?: string;
          subject?: string;
          content?: string;
          message_type?: 'direct' | 'maintenance' | 'payment' | 'general';
          is_read?: boolean;
          attachments?: string[];
          parent_message_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          property_id?: string;
          participants: string[];
          last_message_id?: string;
          last_message_at?: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id?: string;
          participants: string[];
          last_message_id?: string;
          last_message_at?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          participants?: string[];
          last_message_id?: string;
          last_message_at?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          property_id?: string;
          tenant_id?: string;
          uploaded_by: string;
          name: string;
          file_type: 'pdf' | 'image' | 'document' | 'spreadsheet' | 'other';
          file_url: string;
          file_size: number;
          category:
            | 'lease'
            | 'identification'
            | 'financial'
            | 'maintenance'
            | 'insurance'
            | 'legal'
            | 'other';
          description?: string;
          is_public: boolean;
          expires_at?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id?: string;
          tenant_id?: string;
          uploaded_by: string;
          name: string;
          file_type: 'pdf' | 'image' | 'document' | 'spreadsheet' | 'other';
          file_url: string;
          file_size: number;
          category:
            | 'lease'
            | 'identification'
            | 'financial'
            | 'maintenance'
            | 'insurance'
            | 'legal'
            | 'other';
          description?: string;
          is_public?: boolean;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          tenant_id?: string;
          uploaded_by?: string;
          name?: string;
          file_type?: 'pdf' | 'image' | 'document' | 'spreadsheet' | 'other';
          file_url?: string;
          file_size?: number;
          category?:
            | 'lease'
            | 'identification'
            | 'financial'
            | 'maintenance'
            | 'insurance'
            | 'legal'
            | 'other';
          description?: string;
          is_public?: boolean;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type:
            | 'payment'
            | 'maintenance'
            | 'lease'
            | 'system'
            | 'announcement'
            | 'reminder';
          priority: 'low' | 'medium' | 'high';
          is_read: boolean;
          action_url?: string;
          data?: Record<string, any>;
          expires_at?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type:
            | 'payment'
            | 'maintenance'
            | 'lease'
            | 'system'
            | 'announcement'
            | 'reminder';
          priority?: 'low' | 'medium' | 'high';
          is_read?: boolean;
          action_url?: string;
          data?: Record<string, any>;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?:
            | 'payment'
            | 'maintenance'
            | 'lease'
            | 'system'
            | 'announcement'
            | 'reminder';
          priority?: 'low' | 'medium' | 'high';
          is_read?: boolean;
          action_url?: string;
          data?: Record<string, any>;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      announcements: {
        Row: {
          id: string;
          property_id?: string;
          created_by: string;
          title: string;
          content: string;
          type: 'general' | 'maintenance' | 'policy' | 'event' | 'emergency';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          target_audience: 'all' | 'tenants' | 'owners' | 'specific';
          target_users?: string[];
          attachments: string[];
          is_published: boolean;
          published_at?: string;
          expires_at?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id?: string;
          created_by: string;
          title: string;
          content: string;
          type?: 'general' | 'maintenance' | 'policy' | 'event' | 'emergency';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          target_audience?: 'all' | 'tenants' | 'owners' | 'specific';
          target_users?: string[];
          attachments?: string[];
          is_published?: boolean;
          published_at?: string;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          created_by?: string;
          title?: string;
          content?: string;
          type?: 'general' | 'maintenance' | 'policy' | 'event' | 'emergency';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          target_audience?: 'all' | 'tenants' | 'owners' | 'specific';
          target_users?: string[];
          attachments?: string[];
          is_published?: boolean;
          published_at?: string;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      system_settings: {
        Row: {
          id: string;
          setting_key: string;
          setting_value: Record<string, any>;
          category: 'payment' | 'notification' | 'system' | 'security' | 'api';
          description?: string;
          is_active: boolean;
          updated_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          setting_key: string;
          setting_value: Record<string, any>;
          category: 'payment' | 'notification' | 'system' | 'security' | 'api';
          description?: string;
          is_active?: boolean;
          updated_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          setting_key?: string;
          setting_value?: Record<string, any>;
          category?: 'payment' | 'notification' | 'system' | 'security' | 'api';
          description?: string;
          is_active?: boolean;
          updated_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id?: string;
          action: string;
          entity_type: string;
          entity_id: string;
          old_values?: Record<string, any>;
          new_values?: Record<string, any>;
          ip_address?: string;
          user_agent?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          action: string;
          entity_type: string;
          entity_id: string;
          old_values?: Record<string, any>;
          new_values?: Record<string, any>;
          ip_address?: string;
          user_agent?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          entity_type?: string;
          entity_id?: string;
          old_values?: Record<string, any>;
          new_values?: Record<string, any>;
          ip_address?: string;
          user_agent?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      property_occupancy: {
        Row: {
          property_id: string;
          property_name: string;
          total_units: number;
          occupied_units: number;
          available_units: number;
          occupancy_rate: number;
        };
      };
      payment_summary: {
        Row: {
          property_id: string;
          tenant_id: string;
          total_due: number;
          total_paid: number;
          outstanding_balance: number;
          last_payment_date: string;
        };
      };
    };
    Functions: {
      increment_occupied_units: {
        Args: {
          property_id: string;
        };
        Returns: void;
      };
      decrement_occupied_units: {
        Args: {
          property_id: string;
        };
        Returns: void;
      };
      calculate_monthly_payments: {
        Args: {
          tenant_id: string;
          year: number;
          month: number;
        };
        Returns: {
          rent: number;
          late_fees: number;
          utilities: number;
          total: number;
        }[];
      };
      get_property_analytics: {
        Args: {
          property_id: string;
          start_date: string;
          end_date: string;
        };
        Returns: {
          total_income: number;
          occupancy_rate: number;
          maintenance_costs: number;
          tenant_count: number;
        };
      };
      send_notification: {
        Args: {
          user_ids: string[];
          title: string;
          message: string;
          type: string;
          priority?: string;
        };
        Returns: void;
      };
    };
    Enums: {
      user_role: 'owner' | 'tenant' | 'admin';
      property_type: 'residential' | 'commercial' | 'dormitory';
      property_status: 'active' | 'maintenance' | 'inactive';
      tenant_status: 'active' | 'pending' | 'terminated' | 'expired';
      payment_type:
        | 'rent'
        | 'deposit'
        | 'security_deposit'
        | 'utility'
        | 'penalty'
        | 'other';
      payment_method: 'gcash' | 'maya' | 'bank_transfer' | 'check';
      payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partial';
      maintenance_category:
        | 'plumbing'
        | 'electrical'
        | 'hvac'
        | 'appliance'
        | 'pest_control'
        | 'cleaning'
        | 'security'
        | 'other';
      maintenance_priority: 'low' | 'medium' | 'high' | 'urgent';
      maintenance_status:
        | 'pending'
        | 'in_progress'
        | 'completed'
        | 'cancelled'
        | 'rejected';
      message_type: 'direct' | 'maintenance' | 'payment' | 'general';
      file_type: 'pdf' | 'image' | 'document' | 'spreadsheet' | 'other';
      document_category:
        | 'lease'
        | 'identification'
        | 'financial'
        | 'maintenance'
        | 'insurance'
        | 'legal'
        | 'other';
      notification_type:
        | 'payment'
        | 'maintenance'
        | 'lease'
        | 'system'
        | 'announcement'
        | 'reminder';
      notification_priority: 'low' | 'medium' | 'high';
      announcement_type:
        | 'general'
        | 'maintenance'
        | 'policy'
        | 'event'
        | 'emergency';
      announcement_priority: 'low' | 'medium' | 'high' | 'urgent';
      target_audience: 'all' | 'tenants' | 'owners' | 'specific';
      system_setting_category:
        | 'payment'
        | 'notification'
        | 'system'
        | 'security'
        | 'api';
    };
  };
}
