'use client';

import { useState, useEffect, useRef } from 'react';
import {
  MessagesAPI,
  type Message,
  type Conversation
} from '@/lib/api/messages';

interface UsePollingMessagesProps {
  conversationId: string;
  userId: string;
  interval?: number; // Polling interval in milliseconds
  enabled?: boolean;
}

export function usePollingMessages({
  conversationId,
  userId,
  interval = 2000, // Poll every 2 seconds
  enabled = true
}: UsePollingMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoad = useRef(true);

  // Load messages initially
  useEffect(() => {
    const loadMessages = async () => {
      if (!conversationId || !userId) return;

      try {
        setIsLoading(true);
        const result = await MessagesAPI.getConversationMessages(
          conversationId,
          userId
        );

        if (result.success && result.data) {
          setMessages(result.data);

          // Set the last message ID for comparison
          if (result.data.length > 0) {
            setLastMessageId(result.data[result.data.length - 1].id);
          }

          console.log('Initial messages loaded:', result.data.length);
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoading(false);
        isInitialLoad.current = false;
      }
    };

    loadMessages();
  }, [conversationId, userId]);

  // Polling mechanism
  useEffect(() => {
    if (!enabled || !conversationId || !userId || isInitialLoad.current) return;

    const pollMessages = async () => {
      try {
        const result = await MessagesAPI.getConversationMessages(
          conversationId,
          userId
        );

        if (result.success && result.data) {
          const currentLastMessageId =
            result.data.length > 0
              ? result.data[result.data.length - 1].id
              : null;

          // Check if there are new messages
          if (currentLastMessageId && currentLastMessageId !== lastMessageId) {
            console.log(
              'New messages detected via polling:',
              result.data.length
            );
            setMessages(result.data);
            setLastMessageId(currentLastMessageId);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // Start polling
    intervalRef.current = setInterval(pollMessages, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [conversationId, userId, interval, enabled, lastMessageId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    messages,
    isLoading,
    refreshMessages: async () => {
      if (!conversationId || !userId) return;

      try {
        const result = await MessagesAPI.getConversationMessages(
          conversationId,
          userId
        );
        if (result.success && result.data) {
          setMessages(result.data);
          if (result.data.length > 0) {
            setLastMessageId(result.data[result.data.length - 1].id);
          }
        }
      } catch (error) {
        console.error('Failed to refresh messages:', error);
      }
    }
  };
}

