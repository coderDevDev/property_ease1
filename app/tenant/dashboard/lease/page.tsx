'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building,
  Calendar,
  CreditCard,
  FileText,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { TenantAPI } from '@/lib/api/tenant';

interface LeaseDocument {
  id: string;
  name: string;
  type: string;
  uploaded_at: string;
  size: number;
  url: string;
}

interface LeasePayment {
  id: string;
  amount: number;
  due_date: string;
  paid_date?: string;
  status: 'paid' | 'pending' | 'overdue';
  payment_method?: string;
  transaction_id?: string;
}

interface LeaseDetails {
  id: string;
  property_name: string;
  unit_number: string;
  lease_start: Date;
  lease_end: Date;
  monthly_rent: number;
  security_deposit: number;
  status: string;
  documents: LeaseDocument[];
  payments: LeasePayment[];
  terms_and_conditions: string[];
  property_details: {
    address: string;
    type: string;
    amenities: string[];
    owner_name: string;
    owner_contact: string;
  };
}

export default function LeasePage() {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [lease, setLease] = useState<LeaseDetails | null>(null);

  useEffect(() => {
    const fetchLeaseDetails = async () => {
      if (!authState.user?.id) return;

      try {
        setLoading(true);
        const result = await TenantAPI.getLeaseDetails(authState.user.id);

        if (result.success && result.data) {
          setLease(result.data);
        } else {
          toast.error('Failed to load lease details');
        }
      } catch (error) {
        console.error('Failed to fetch lease details:', error);
        toast.error('Failed to load lease details');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaseDetails();
  }, [authState.user?.id]);

  const handleDownloadDocument = async (document: LeaseDocument) => {
    try {
      const result = await TenantAPI.downloadLeaseDocument(document.id);
      if (result.success && result.url) {
        window.open(result.url, '_blank');
      } else {
        toast.error('Failed to download document');
      }
    } catch (error) {
      console.error('Failed to download document:', error);
      toast.error('Failed to download document');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lease details...</p>
        </div>
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Active Lease
          </h3>
          <p className="text-gray-600 mb-4">
            You don't currently have an active lease agreement.
          </p>
          <Button
            onClick={() =>
              (window.location.href = '/tenant/dashboard/properties')
            }
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
            Browse Properties
          </Button>
        </div>
      </div>
    );
  }

  const daysUntilExpiry = Math.ceil(
    (lease.lease_end.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  const isExpiringSoon = daysUntilExpiry <= 30;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Lease Agreement
        </h1>
        <p className="text-gray-600">
          View and manage your current lease agreement and related documents
        </p>
      </div>

      {/* Lease Status Card */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {lease.property_name}
                </h2>
                <p className="text-gray-600">Unit {lease.unit_number}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                className={`${
                  isExpiringSoon
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-green-100 text-green-700'
                } border-0`}>
                {isExpiringSoon ? (
                  <>
                    <Clock className="w-3 h-3 mr-1" />
                    Expires in {daysUntilExpiry} days
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </>
                )}
              </Badge>
              <Button
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={() => handleDownloadDocument(lease.documents[0])}>
                <FileText className="w-4 h-4 mr-2" />
                View Agreement
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-blue-100">
          <TabsTrigger
            value="details"
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            Lease Details
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            Payments
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            Documents
          </TabsTrigger>
          <TabsTrigger
            value="terms"
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            Terms
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Lease Period
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Start Date</p>
                    <p className="font-semibold text-gray-900">
                      {lease.lease_start.toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">End Date</p>
                    <p className="font-semibold text-gray-900">
                      {lease.lease_end.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {isExpiringSoon && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-700">
                      <Info className="w-4 h-4" />
                      <p className="text-sm font-medium">
                        Your lease is expiring soon. Contact your property
                        manager to discuss renewal options.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Financial Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Monthly Rent</p>
                    <p className="font-semibold text-gray-900">
                      ₱{lease.monthly_rent.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Security Deposit
                    </p>
                    <p className="font-semibold text-gray-900">
                      ₱{lease.security_deposit.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100 md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-600" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Address</p>
                    <p className="font-semibold text-gray-900">
                      {lease.property_details.address}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Property Type</p>
                    <p className="font-semibold text-gray-900">
                      {lease.property_details.type}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Property Owner</p>
                    <p className="font-semibold text-gray-900">
                      {lease.property_details.owner_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Contact Number</p>
                    <p className="font-semibold text-gray-900">
                      {lease.property_details.owner_contact}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {lease.property_details.amenities.map((amenity, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-gray-100">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lease.payments.map(payment => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-full ${
                          payment.status === 'paid'
                            ? 'bg-green-100'
                            : payment.status === 'pending'
                            ? 'bg-yellow-100'
                            : 'bg-red-100'
                        }`}>
                        <CreditCard
                          className={`w-4 h-4 ${
                            payment.status === 'paid'
                              ? 'text-green-600'
                              : payment.status === 'pending'
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          ₱{payment.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Due: {new Date(payment.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        className={`${
                          payment.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : payment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        } border-0`}>
                        {payment.status.charAt(0).toUpperCase() +
                          payment.status.slice(1)}
                      </Badge>
                      {payment.status === 'pending' && (
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Lease Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lease.documents.map(document => (
                  <div
                    key={document.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {document.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Uploaded:{' '}
                          {new Date(document.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() => handleDownloadDocument(document)}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="terms" className="mt-6">
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Terms and Conditions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lease.terms_and_conditions.map((term, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="p-1 bg-blue-100 rounded-full">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-gray-700">{term}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
