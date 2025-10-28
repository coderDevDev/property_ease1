'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Database, Users, FileText, Wrench, MessageSquare, Bell } from 'lucide-react';

interface DeletePropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  propertyName: string;
  isDeleting?: boolean;
}

export function DeletePropertyModal({
  isOpen,
  onClose,
  onConfirm,
  propertyName,
  isDeleting = false
}: DeletePropertyModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <AlertDialogTitle className="text-xl">
              Delete Property
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base space-y-4 pt-2">
            <p className="font-semibold text-gray-900">
              Are you sure you want to delete "{propertyName}"?
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium mb-2">
                ⚠️ This action cannot be undone!
              </p>
              <p className="text-red-700 text-sm">
                Deleting this property will permanently remove all associated data from the database.
              </p>
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-gray-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                The following related data will be permanently deleted:
              </p>
              
              <div className="space-y-2 ml-7">
                <div className="flex items-start gap-2 text-sm">
                  <Users className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">Tenants & Leases:</span>
                    <span className="text-gray-600"> All tenant records, lease agreements, and rental history</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-sm">
                  <FileText className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">Payments:</span>
                    <span className="text-gray-600"> All payment records, receipts, and transaction history</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-sm">
                  <Wrench className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">Maintenance Requests:</span>
                    <span className="text-gray-600"> All maintenance records, work orders, and service history</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-sm">
                  <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">Messages & Conversations:</span>
                    <span className="text-gray-600"> All messages and communication threads related to this property</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-sm">
                  <FileText className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">Documents:</span>
                    <span className="text-gray-600"> All uploaded documents, contracts, and files</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-sm">
                  <Bell className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">Notifications:</span>
                    <span className="text-gray-600"> All property-related notifications and alerts</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                <span className="font-semibold">💡 Tip:</span> If you want to temporarily hide this property instead of deleting it, 
                consider changing its status to "Inactive" from the edit page.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel 
            disabled={isDeleting}
            className="border-gray-300"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Deleting...
              </>
            ) : (
              'Delete Property'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
