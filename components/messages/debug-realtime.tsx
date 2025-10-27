'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DebugRealtimeProps {
  userId: string;
}

export function DebugRealtime({ userId }: DebugRealtimeProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [testMessage, setTestMessage] = useState('');

  const testRealtimeConnection = async () => {
    try {
      console.log('Testing real-time connection for user:', userId);

      // Test basic connection
      const { data, error } = await supabase
        .from('messages')
        .select('count')
        .limit(1);

      if (error) {
        console.error('Database connection error:', error);
        console.error('Error details:', error.message, error.code);
      } else {
        console.log('Database connection OK:', data);
      }

      // Test user-specific query
      const { data: userData, error: userError } = await supabase
        .from('messages')
        .select('id, content')
        .eq('recipient_id', userId)
        .limit(1);

      if (userError) {
        console.error('User-specific query error:', userError);
        console.error('User error details:', userError.message, userError.code);
      } else {
        console.log('User-specific query OK:', userData);
      }

      // Test real-time subscription
      const testChannel = supabase.channel(`test-connection-${userId}`);
      testChannel.subscribe(status => {
        console.log('Test channel status:', status);
        console.log('Test channel state:', testChannel.state);
      });

      setTimeout(() => {
        supabase.removeChannel(testChannel);
      }, 2000);
    } catch (error) {
      console.error('Test connection error:', error);
    }
  };

  useEffect(() => {
    if (!userId) return;

    console.log('Setting up debug real-time subscription for user:', userId);
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('User ID type:', typeof userId);
    console.log('User ID value:', userId);

    const channel = supabase
      .channel(`debug-realtime-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`
        },
        payload => {
          console.log('DEBUG: Message received:', payload);
          setEvents(prev => [
            {
              id: Date.now(),
              type: 'received',
              event: payload.eventType,
              data: payload.new,
              timestamp: new Date().toLocaleTimeString()
            },
            ...prev.slice(0, 9) // Keep only last 10 events
          ]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${userId}`
        },
        payload => {
          console.log('DEBUG: Message sent:', payload);
          setEvents(prev => [
            {
              id: Date.now(),
              type: 'sent',
              event: payload.eventType,
              data: payload.new,
              timestamp: new Date().toLocaleTimeString()
            },
            ...prev.slice(0, 9) // Keep only last 10 events
          ]);
        }
      )
      .subscribe(status => {
        console.log('DEBUG: Subscription status:', status);
        console.log('DEBUG: Channel state:', channel.state);
        console.log('DEBUG: Channel name:', channel.topic);
        setIsConnected(status === 'SUBSCRIBED');

        if (status !== 'SUBSCRIBED') {
          console.error('DEBUG: Failed to subscribe to real-time updates');
          console.error('DEBUG: Status:', status);
          console.error('DEBUG: Channel state:', channel.state);
        } else {
          console.log('DEBUG: Successfully subscribed to real-time updates');
        }
      });

    return () => {
      console.log('DEBUG: Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <Card className="fixed bottom-4 right-4 w-80 bg-white/90 backdrop-blur-sm border-blue-200/50 shadow-lg z-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          Real-time Debug
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Test Connection Button */}
          <Button
            onClick={testRealtimeConnection}
            size="sm"
            variant="outline"
            className="w-full text-xs">
            Test Connection
          </Button>

          {/* Events List */}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-xs text-gray-500">No events yet...</p>
            ) : (
              events.map(event => (
                <div key={event.id} className="text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="outline"
                      className={
                        event.type === 'received'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-green-50 text-green-700 border-green-200'
                      }>
                      {event.type}
                    </Badge>
                    <span className="text-gray-500">{event.timestamp}</span>
                  </div>
                  <p className="text-gray-700">
                    {event.event}: {event.data?.content?.substring(0, 30)}...
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
