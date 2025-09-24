'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Announcement } from '@/lib/api/announcements';

interface UseRealtimeAnnouncementsProps {
  propertyIds: string[];
  onAnnouncementUpdate: (announcement: Announcement) => void;
  onAnnouncementCreate: (announcement: Announcement) => void;
  onAnnouncementDelete: (announcementId: string) => void;
}

export function useRealtimeAnnouncements({
  propertyIds,
  onAnnouncementUpdate,
  onAnnouncementCreate,
  onAnnouncementDelete
}: UseRealtimeAnnouncementsProps) {
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (propertyIds.length === 0) return;

    console.log(
      'Setting up real-time announcements subscription for properties:',
      propertyIds
    );

    // Subscribe to announcements table changes
    subscriptionRef.current = supabase
      .channel('announcements-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
          filter: `property_id=in.(${propertyIds.join(',')})`
        },
        async payload => {
          console.log('Announcement real-time event:', payload);

          try {
            if (payload.eventType === 'INSERT') {
              // New announcement created
              const newAnnouncement = payload.new as Announcement;

              // Show notification for new published announcements
              if (newAnnouncement.is_published) {
                toast.success(`New announcement: ${newAnnouncement.title}`);
              }

              onAnnouncementCreate(newAnnouncement);
            } else if (payload.eventType === 'UPDATE') {
              // Announcement updated
              const updatedAnnouncement = payload.new as Announcement;

              // Show notification for status changes
              if (
                updatedAnnouncement.is_published &&
                !payload.old.is_published
              ) {
                toast.success(
                  `Announcement published: ${updatedAnnouncement.title}`
                );
              }

              onAnnouncementUpdate(updatedAnnouncement);
            } else if (payload.eventType === 'DELETE') {
              // Announcement deleted
              const deletedAnnouncementId = payload.old.id;
              onAnnouncementDelete(deletedAnnouncementId);
            }
          } catch (error) {
            console.error(
              'Error handling real-time announcement event:',
              error
            );
          }
        }
      )
      .subscribe(status => {
        console.log('Announcements real-time subscription status:', status);

        if (status === 'SUBSCRIBED') {
          console.log(
            'Successfully subscribed to announcements real-time updates'
          );
        } else if (status === 'CHANNEL_ERROR') {
          console.error(
            'Failed to subscribe to announcements real-time updates'
          );
          toast.error('Failed to connect to real-time updates');
        }
      });

    return () => {
      if (subscriptionRef.current) {
        console.log('Cleaning up announcements real-time subscription');
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [
    propertyIds,
    onAnnouncementUpdate,
    onAnnouncementCreate,
    onAnnouncementDelete
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, []);
}

