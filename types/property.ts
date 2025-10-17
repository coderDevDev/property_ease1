export interface Property {
  id: string;
  name: string;
  type: 'residential' | 'commercial' | 'dormitory';
  address: string;
  city: string;
  province: string;
  postalCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  totalUnits: number;
  occupiedUnits: number;
  monthlyRent: number;
  status: 'active' | 'maintenance' | 'inactive';
  description?: string;
  amenities: string[];
  images: string[];
  thumbnail?: string;
  floorPlan?: string;
  propertyRules?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  userId: string;
  propertyId: string;
  unitNumber: string;
  leaseStart: string;
  leaseEnd: string;
  monthlyRent: number;
  deposit: number;
  securityDeposit: number;
  status: 'active' | 'pending' | 'terminated' | 'expired';
  documents: string[];
  leaseAgreementUrl?: string;
  moveInDate?: string;
  moveOutDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaseAgreement {
  id: string;
  propertyId: string;
  tenantId: string;
  unitNumber: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  terms: string[];
  status: 'active' | 'expired' | 'terminated';
  signedDate: string;
  documents: string[];
}

export interface Payment {
  id: string;
  tenantId: string;
  propertyId: string;
  amount: number;
  paymentType:
    | 'rent'
    | 'deposit'
    | 'security_deposit'
    | 'utility'
    | 'penalty'
    | 'other';
  paymentMethod: 'gcash' | 'maya' | 'bank_transfer' | 'check';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partial';
  dueDate: string;
  paidDate?: string;
  lateFee?: number;
  referenceNumber?: string;
  receiptUrl?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceRequest {
  id: string;
  tenantId: string;
  propertyId: string;
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
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
  images: string[];
  estimatedCost?: number;
  actualCost?: number;
  assignedTo?: string;
  scheduledDate?: string;
  completedDate?: string;
  tenantNotes?: string;
  ownerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  propertyId?: string;
  subject?: string;
  content: string;
  messageType: 'direct' | 'maintenance' | 'payment' | 'general';
  isRead: boolean;
  attachments: string[];
  parentMessageId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  propertyId?: string;
  participants: string[];
  lastMessageId?: string;
  lastMessageAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  propertyId?: string;
  tenantId?: string;
  uploadedBy: string;
  name: string;
  fileType: 'pdf' | 'image' | 'document' | 'spreadsheet' | 'other';
  fileUrl: string;
  fileSize: number;
  category:
    | 'lease'
    | 'identification'
    | 'financial'
    | 'maintenance'
    | 'insurance'
    | 'legal'
    | 'other';
  description?: string;
  isPublic: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
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
  isRead: boolean;
  actionUrl?: string;
  data?: Record<string, any>;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  propertyId?: string;
  createdBy: string;
  title: string;
  content: string;
  type: 'general' | 'maintenance' | 'policy' | 'event' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetAudience: 'all' | 'tenants' | 'owners' | 'specific';
  targetUsers?: string[];
  attachments: string[];
  isPublished: boolean;
  publishedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}
