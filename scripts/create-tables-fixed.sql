-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE user_role AS ENUM ('owner', 'tenant', 'admin');
CREATE TYPE property_type AS ENUM ('residential', 'commercial', 'dormitory');
CREATE TYPE property_status AS ENUM ('active', 'maintenance', 'inactive');
CREATE TYPE tenant_status AS ENUM ('active', 'pending', 'terminated', 'expired');
CREATE TYPE payment_type AS ENUM ('rent', 'deposit', 'security_deposit', 'utility', 'penalty', 'other');
CREATE TYPE payment_method AS ENUM ('gcash', 'maya', 'bank_transfer', 'cash', 'check');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded', 'partial');
CREATE TYPE maintenance_category AS ENUM ('plumbing', 'electrical', 'hvac', 'appliance', 'pest_control', 'cleaning', 'security', 'other');
CREATE TYPE maintenance_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE maintenance_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled', 'rejected');
CREATE TYPE message_type AS ENUM ('direct', 'maintenance', 'payment', 'general');
CREATE TYPE file_type AS ENUM ('pdf', 'image', 'document', 'spreadsheet', 'other');
CREATE TYPE document_category AS ENUM ('lease', 'identification', 'financial', 'maintenance', 'insurance', 'legal', 'other');
CREATE TYPE notification_type AS ENUM ('payment', 'maintenance', 'lease', 'system', 'announcement', 'reminder');
CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE announcement_type AS ENUM ('general', 'maintenance', 'policy', 'event', 'emergency');
CREATE TYPE announcement_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE target_audience AS ENUM ('all', 'tenants', 'owners', 'specific');
CREATE TYPE system_setting_category AS ENUM ('payment', 'notification', 'system', 'security', 'api');

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'tenant',
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  -- Owner specific fields
  company_name TEXT,
  business_license TEXT,
  -- Tenant specific fields
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  -- Admin specific fields
  permissions TEXT[] DEFAULT '{}'
);

-- Create properties table
CREATE TABLE public.properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type property_type NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  postal_code TEXT,
  coordinates JSONB, -- {lat: number, lng: number}
  total_units INTEGER NOT NULL CHECK (total_units > 0),
  occupied_units INTEGER DEFAULT 0 CHECK (occupied_units >= 0),
  monthly_rent DECIMAL(10,2) NOT NULL CHECK (monthly_rent >= 0),
  status property_status DEFAULT 'active',
  description TEXT,
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  thumbnail TEXT,
  floor_plan TEXT,
  property_rules TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT occupied_units_check CHECK (occupied_units <= total_units)
);

-- Create tenants table
CREATE TABLE public.tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  unit_number TEXT NOT NULL,
  lease_start DATE NOT NULL,
  lease_end DATE NOT NULL,
  monthly_rent DECIMAL(10,2) NOT NULL CHECK (monthly_rent >= 0),
  deposit DECIMAL(10,2) NOT NULL CHECK (deposit >= 0),
  security_deposit DECIMAL(10,2) DEFAULT 0 CHECK (security_deposit >= 0),
  status tenant_status DEFAULT 'pending',
  documents TEXT[] DEFAULT '{}',
  lease_agreement_url TEXT,
  move_in_date DATE,
  move_out_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(property_id, unit_number),
  CONSTRAINT lease_dates_check CHECK (lease_end > lease_start)
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  payment_type payment_type NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  due_date DATE NOT NULL,
  paid_date TIMESTAMP WITH TIME ZONE,
  late_fee DECIMAL(10,2) DEFAULT 0 CHECK (late_fee >= 0),
  reference_number TEXT,
  receipt_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create maintenance_requests table
CREATE TABLE public.maintenance_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category maintenance_category NOT NULL,
  priority maintenance_priority DEFAULT 'medium',
  status maintenance_status DEFAULT 'pending',
  images TEXT[] DEFAULT '{}',
  estimated_cost DECIMAL(10,2) CHECK (estimated_cost >= 0),
  actual_cost DECIMAL(10,2) CHECK (actual_cost >= 0),
  assigned_to UUID REFERENCES public.users(id),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  tenant_notes TEXT,
  owner_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  participants UUID[] NOT NULL,
  last_message_id UUID,
  last_message_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  subject TEXT,
  content TEXT NOT NULL,
  message_type message_type DEFAULT 'direct',
  is_read BOOLEAN DEFAULT FALSE,
  attachments TEXT[] DEFAULT '{}',
  parent_message_id UUID REFERENCES public.messages(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update conversations table to reference messages
ALTER TABLE public.conversations 
ADD CONSTRAINT fk_last_message 
FOREIGN KEY (last_message_id) REFERENCES public.messages(id);

-- Create documents table
CREATE TABLE public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  file_type file_type NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL CHECK (file_size > 0),
  category document_category NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL,
  priority notification_priority DEFAULT 'medium',
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  data JSONB,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create announcements table
CREATE TABLE public.announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type announcement_type DEFAULT 'general',
  priority announcement_priority DEFAULT 'medium',
  target_audience target_audience DEFAULT 'all',
  target_users UUID[],
  attachments TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system_settings table
CREATE TABLE public.system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  category system_setting_category NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_is_active ON public.users(is_active);
CREATE INDEX idx_properties_owner_id ON public.properties(owner_id);
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_properties_city ON public.properties(city);
CREATE INDEX idx_tenants_user_id ON public.tenants(user_id);
CREATE INDEX idx_tenants_property_id ON public.tenants(property_id);
CREATE INDEX idx_tenants_status ON public.tenants(status);
CREATE INDEX idx_payments_tenant_id ON public.payments(tenant_id);
CREATE INDEX idx_payments_property_id ON public.payments(property_id);
CREATE INDEX idx_payments_status ON public.payments(payment_status);
CREATE INDEX idx_payments_due_date ON public.payments(due_date);
CREATE INDEX idx_maintenance_tenant_id ON public.maintenance_requests(tenant_id);
CREATE INDEX idx_maintenance_property_id ON public.maintenance_requests(property_id);
CREATE INDEX idx_maintenance_status ON public.maintenance_requests(status);
CREATE INDEX idx_maintenance_priority ON public.maintenance_requests(priority);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX idx_messages_is_read ON public.messages(is_read);
CREATE INDEX idx_documents_property_id ON public.documents(property_id);
CREATE INDEX idx_documents_tenant_id ON public.documents(tenant_id);
CREATE INDEX idx_documents_uploaded_by ON public.documents(uploaded_by);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_announcements_property_id ON public.announcements(property_id);
CREATE INDEX idx_announcements_is_published ON public.announcements(is_published);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for properties table
CREATE POLICY "Property owners can view own properties" ON public.properties
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Property owners can insert own properties" ON public.properties
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Property owners can update own properties" ON public.properties
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Property owners can delete own properties" ON public.properties
  FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "Tenants can view properties they rent" ON public.properties
  FOR SELECT USING (
    id IN (
      SELECT property_id FROM public.tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all properties" ON public.properties
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for tenants table
CREATE POLICY "Tenants can view own tenant record" ON public.tenants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Property owners can view tenants of their properties" ON public.tenants
  FOR SELECT USING (
    auth.uid() IN (
      SELECT owner_id FROM public.properties WHERE id = property_id
    )
  );

CREATE POLICY "Property owners can manage tenants of their properties" ON public.tenants
  FOR ALL USING (
    auth.uid() IN (
      SELECT owner_id FROM public.properties WHERE id = property_id
    )
  );

CREATE POLICY "Admins can view all tenants" ON public.tenants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for payments table
CREATE POLICY "Tenants can view own payments" ON public.payments
  FOR SELECT USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Property owners can view payments for their properties" ON public.payments
  FOR SELECT USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Property owners can manage payments for their properties" ON public.payments
  FOR ALL USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for maintenance_requests table
CREATE POLICY "Tenants can view own maintenance requests" ON public.maintenance_requests
  FOR SELECT USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenants can create maintenance requests" ON public.maintenance_requests
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Property owners can view maintenance requests for their properties" ON public.maintenance_requests
  FOR SELECT USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Property owners can manage maintenance requests for their properties" ON public.maintenance_requests
  FOR ALL USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

-- RLS Policies for conversations and messages
CREATE POLICY "Users can view conversations they participate in" ON public.conversations
  FOR SELECT USING (auth.uid() = ANY(participants));

CREATE POLICY "Users can create conversations they participate in" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = ANY(participants));

CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
  );

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- RLS Policies for documents table
CREATE POLICY "Users can view public documents" ON public.documents
  FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Tenants can view documents for their properties" ON public.documents
  FOR SELECT USING (
    property_id IN (
      SELECT property_id FROM public.tenants WHERE user_id = auth.uid()
    ) OR
    tenant_id IN (
      SELECT id FROM public.tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Property owners can view documents for their properties" ON public.documents
  FOR SELECT USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- RLS Policies for notifications table
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for announcements table
CREATE POLICY "Users can view published announcements" ON public.announcements
  FOR SELECT USING (
    is_published = TRUE AND (
      target_audience = 'all' OR
      (target_audience = 'tenants' AND EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'tenant'
      )) OR
      (target_audience = 'owners' AND EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'owner'
      )) OR
      (target_audience = 'specific' AND auth.uid() = ANY(target_users))
    )
  );

CREATE POLICY "Property owners can manage announcements for their properties" ON public.announcements
  FOR ALL USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    ) OR auth.uid() = created_by
  );

-- RLS Policies for system_settings table (Admin only)
CREATE POLICY "Admins can manage system settings" ON public.system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for audit_logs table (Admin only)
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_updated_at BEFORE UPDATE ON public.maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create improved function to handle user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  first_name_val TEXT;
  last_name_val TEXT;
  phone_val TEXT;
  role_val TEXT;
  is_admin_val BOOLEAN;
BEGIN
  -- Safely extract values from metadata with defaults
  first_name_val := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  last_name_val := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  phone_val := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  role_val := COALESCE(NEW.raw_user_meta_data->>'role', 'tenant');
  is_admin_val := COALESCE((NEW.raw_user_meta_data->>'is_admin')::BOOLEAN, FALSE);
  
  -- Ensure admin role consistency
  IF role_val = 'admin' THEN
    is_admin_val := TRUE;
  END IF;
  
  -- Insert user record with safe defaults
  INSERT INTO public.users (
    id, 
    email, 
    first_name, 
    last_name, 
    phone, 
    role,
    is_admin,
    is_verified,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    first_name_val,
    last_name_val,
    phone_val,
    role_val::user_role,
    is_admin_val,
    FALSE,
    TRUE,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the registration
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function to increment occupied units
CREATE OR REPLACE FUNCTION public.increment_occupied_units(property_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.properties 
  SET occupied_units = occupied_units + 1, updated_at = NOW()
  WHERE id = property_id AND occupied_units < total_units;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to decrement occupied units
CREATE OR REPLACE FUNCTION public.decrement_occupied_units(property_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.properties 
  SET occupied_units = GREATEST(occupied_units - 1, 0), updated_at = NOW()
  WHERE id = property_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate monthly payments for a tenant
CREATE OR REPLACE FUNCTION public.calculate_monthly_payments(
  tenant_id UUID,
  year INTEGER,
  month INTEGER
)
RETURNS TABLE(
  rent DECIMAL(10,2),
  late_fees DECIMAL(10,2),
  utilities DECIMAL(10,2),
  total DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN payment_type = 'rent' THEN amount ELSE 0 END), 0) as rent,
    COALESCE(SUM(late_fee), 0) as late_fees,
    COALESCE(SUM(CASE WHEN payment_type = 'utility' THEN amount ELSE 0 END), 0) as utilities,
    COALESCE(SUM(amount + COALESCE(late_fee, 0)), 0) as total
  FROM public.payments 
  WHERE payments.tenant_id = calculate_monthly_payments.tenant_id
    AND EXTRACT(YEAR FROM due_date) = year
    AND EXTRACT(MONTH FROM due_date) = month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get property analytics
CREATE OR REPLACE FUNCTION public.get_property_analytics(
  property_id UUID,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE(
  total_income DECIMAL(10,2),
  occupancy_rate DECIMAL(5,2),
  maintenance_costs DECIMAL(10,2),
  tenant_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(income.total, 0) as total_income,
    ROUND((prop.occupied_units::DECIMAL / prop.total_units::DECIMAL) * 100, 2) as occupancy_rate,
    COALESCE(maintenance.total, 0) as maintenance_costs,
    prop.occupied_units as tenant_count
  FROM public.properties prop
  LEFT JOIN (
    SELECT 
      property_id as pid,
      SUM(amount) as total
    FROM public.payments 
    WHERE payment_status = 'paid' 
      AND paid_date BETWEEN start_date AND end_date
      AND payments.property_id = get_property_analytics.property_id
    GROUP BY property_id
  ) income ON income.pid = prop.id
  LEFT JOIN (
    SELECT 
      property_id as pid,
      SUM(COALESCE(actual_cost, estimated_cost, 0)) as total
    FROM public.maintenance_requests 
    WHERE status = 'completed'
      AND completed_date BETWEEN start_date AND end_date
      AND maintenance_requests.property_id = get_property_analytics.property_id
    GROUP BY property_id
  ) maintenance ON maintenance.pid = prop.id
  WHERE prop.id = get_property_analytics.property_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send notifications to multiple users
CREATE OR REPLACE FUNCTION public.send_notification(
  user_ids UUID[],
  title TEXT,
  message TEXT,
  type notification_type,
  priority notification_priority DEFAULT 'medium'
)
RETURNS VOID AS $$
DECLARE
  user_id UUID;
BEGIN
  FOREACH user_id IN ARRAY user_ids
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, priority)
    VALUES (user_id, title, message, type, priority);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically update conversation last message
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations 
  SET 
    last_message_id = NEW.id,
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update conversation when message is inserted
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_last_message();

-- Create function to create audit log entry
CREATE OR REPLACE FUNCTION public.create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  user_id_val UUID;
BEGIN
  user_id_val := auth.uid();
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, new_values)
    VALUES (user_id_val, 'INSERT', TG_TABLE_NAME, NEW.id::TEXT, row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
    VALUES (user_id_val, 'UPDATE', TG_TABLE_NAME, NEW.id::TEXT, row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_values)
    VALUES (user_id_val, 'DELETE', TG_TABLE_NAME, OLD.id::TEXT, row_to_json(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for important tables
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.create_audit_log();

CREATE TRIGGER audit_properties AFTER INSERT OR UPDATE OR DELETE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.create_audit_log();

CREATE TRIGGER audit_tenants AFTER INSERT OR UPDATE OR DELETE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.create_audit_log();

CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.create_audit_log();

-- Create views for common queries
CREATE VIEW public.property_occupancy AS
SELECT 
  p.id as property_id,
  p.name as property_name,
  p.total_units,
  p.occupied_units,
  (p.total_units - p.occupied_units) as available_units,
  ROUND((p.occupied_units::DECIMAL / p.total_units::DECIMAL) * 100, 2) as occupancy_rate
FROM public.properties p;

CREATE VIEW public.payment_summary AS
SELECT 
  t.id as tenant_id,
  t.property_id,
  COALESCE(SUM(CASE WHEN p.payment_status IN ('pending') THEN p.amount ELSE 0 END), 0) as total_due,
  COALESCE(SUM(CASE WHEN p.payment_status = 'paid' THEN p.amount ELSE 0 END), 0) as total_paid,
  COALESCE(SUM(CASE WHEN p.payment_status IN ('pending') THEN p.amount ELSE 0 END), 0) as outstanding_balance,
  MAX(p.paid_date) as last_payment_date
FROM public.tenants t
LEFT JOIN public.payments p ON p.tenant_id = t.id
GROUP BY t.id, t.property_id;

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, category, description, updated_by) VALUES
('payment_methods', '{"gcash": true, "maya": true, "bank_transfer": true, "cash": true, "check": false}', 'payment', 'Enabled payment methods', (SELECT id FROM auth.users LIMIT 1)),
('late_fee_settings', '{"enabled": true, "grace_period_days": 3, "flat_fee": 500, "percentage_fee": 0.05}', 'payment', 'Late fee configuration', (SELECT id FROM auth.users LIMIT 1)),
('notification_settings', '{"email": true, "sms": false, "push": true, "reminder_days": [7, 3, 1]}', 'notification', 'Notification preferences', (SELECT id FROM auth.users LIMIT 1)),
('maintenance_categories', '["plumbing", "electrical", "hvac", "appliance", "pest_control", "cleaning", "security", "other"]', 'system', 'Available maintenance categories', (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT (setting_key) DO NOTHING;