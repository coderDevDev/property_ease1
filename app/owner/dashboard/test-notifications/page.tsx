'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { NotificationsAPI } from '@/lib/api/notifications';
import { toast } from 'sonner';

export default function NotificationTestPage() {
  const { authState } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const testNotificationCreation = async () => {
    if (!authState.user?.id) {
      toast.error('User not authenticated');
      return;
    }

    setIsLoading(true);
    try {
      const result = await NotificationsAPI.createNotification({
        user_id: authState.user.id,
        title: 'Test Notification',
        message: 'This is a test notification to verify the system is working',
        type: 'system',
        priority: 'medium',
        action_url: '/owner/dashboard',
        data: { test: true }
      });

      if (result.success) {
        toast.success('Test notification created successfully!');
        console.log('Test notification created:', result.data);
      } else {
        toast.error(`Failed to create test notification: ${result.message}`);
        console.error('Test notification failed:', result);
      }
    } catch (error) {
      console.error('Test notification error:', error);
      toast.error('Error creating test notification');
    } finally {
      setIsLoading(false);
    }
  };

  const testAnnouncementNotification = async () => {
    if (!authState.user?.id) {
      toast.error('User not authenticated');
      return;
    }

    setIsLoading(true);
    try {
      const result = await NotificationsAPI.createAnnouncementNotification(
        'test-announcement-id',
        'Test Announcement',
        'Test Property',
        [authState.user.id]
      );

      if (result.success) {
        toast.success('Test announcement notification created successfully!');
        console.log('Test announcement notification created:', result);
      } else {
        toast.error(
          `Failed to create test announcement notification: ${result.message}`
        );
        console.error('Test announcement notification failed:', result);
      }
    } catch (error) {
      console.error('Test announcement notification error:', error);
      toast.error('Error creating test announcement notification');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
            Notification System Test
          </h1>
          <p className="text-blue-600/70 mt-1">
            Test the notification creation system
          </p>
        </div>

        <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
          <CardHeader>
            <CardTitle>Test Notification Creation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Use these buttons to test if notifications are being created
              properly in the database.
            </p>

            <div className="flex gap-4">
              <Button
                onClick={testNotificationCreation}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white">
                {isLoading ? 'Creating...' : 'Test Basic Notification'}
              </Button>

              <Button
                onClick={testAnnouncementNotification}
                disabled={isLoading}
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50">
                {isLoading ? 'Creating...' : 'Test Announcement Notification'}
              </Button>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">
                Instructions:
              </h3>
              <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                <li>Click the test buttons above</li>
                <li>Check the browser console for detailed logs</li>
                <li>Check if notifications appear in the top navbar</li>
                <li>
                  Go to the notifications page to see if they were created
                </li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

