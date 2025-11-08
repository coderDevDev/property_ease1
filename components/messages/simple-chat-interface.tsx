'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  MessageSquare,
  Send,
  Reply,
  MoreVertical,
  Check,
  CheckCheck,
  Archive,
  Trash2,
  X,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  MessagesAPI,
  type Message,
  type Conversation
} from '@/lib/api/messages';
import { toast } from 'sonner';

interface SimpleChatInterfaceProps {
  conversation: Conversation;
  currentUserId: string;
  onBack: () => void;
  onMessageSent?: (message: Message) => void;
}

export function SimpleChatInterface({
  conversation,
  currentUserId,
  onBack,
  onMessageSent
}: SimpleChatInterfaceProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get the other participant (not current user)
  const otherParticipant = conversation.participants_data.find(
    p => p.id !== currentUserId
  );

  // Load messages initially and set up real-time subscription
  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const result = await MessagesAPI.getConversationMessages(
          conversation.id,
          currentUserId
        );
        if (result.success && result.data) {
          setMessages(result.data);
          console.log('✅ Initial messages loaded:', result.data.length);
        } else {
          toast.error(result.message || 'Failed to load messages');
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
        toast.error('Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();

    // 🔥 REAL-TIME: Subscribe to new messages in this conversation
    console.log('🔌 Setting up real-time subscription for conversation:', conversation.id);
    
    const channel = supabase
      .channel(`conversation-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        async (payload) => {
          console.log('🔥 Real-time: New message received!', payload);
          const newMessage = payload.new as any;

          // Fetch full message details with sender/recipient data
          const { data: fullMessage } = await supabase
            .from('messages')
            .select(`
              *,
              sender:users!messages_sender_id_fkey(id, first_name, last_name, email, avatar_url, role),
              recipient:users!messages_recipient_id_fkey(id, first_name, last_name, email, avatar_url, role),
              property:properties(id, name, address)
            `)
            .eq('id', newMessage.id)
            .single();

          if (fullMessage) {
            setMessages(prev => {
              // Avoid duplicates
              if (prev.some(m => m.id === fullMessage.id)) {
                return prev;
              }
              return [...prev, fullMessage as Message];
            });

            // Auto-scroll to bottom
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);

            // Mark as read if recipient is current user
            if (fullMessage.recipient_id === currentUserId && !fullMessage.is_read) {
              await MessagesAPI.markMessageAsRead(fullMessage.id);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          console.log('🔄 Real-time: Message updated!', payload);
          const updatedMessage = payload.new as any;

          setMessages(prev =>
            prev.map(msg =>
              msg.id === updatedMessage.id
                ? { ...msg, ...updatedMessage }
                : msg
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          console.log('🗑️ Real-time: Message deleted!', payload);
          const deletedId = payload.old.id;

          setMessages(prev => prev.filter(msg => msg.id !== deletedId));
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time connected for conversation:', conversation.id);
        }
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('🔌 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [conversation.id, currentUserId]);

  // ❌ REMOVED: Polling is no longer needed - using real-time subscriptions instead!

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Manual refresh function (optional - real-time should handle everything)
  const refreshMessages = async () => {
    try {
      const result = await MessagesAPI.getConversationMessages(
        conversation.id,
        currentUserId
      );
      if (result.success && result.data) {
        setMessages(result.data);
        toast.success('Messages refreshed');
      }
    } catch (error) {
      console.error('Failed to refresh messages:', error);
      toast.error('Failed to refresh messages');
    }
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !otherParticipant) return;

    setIsSending(true);
    try {
      const messageData = {
        conversation_id: conversation.id,
        recipient_id: otherParticipant.id,
        content: newMessage.trim(),
        message_type: 'direct' as const,
        attachments: [],
        parent_message_id: replyingTo?.id
      };

      const result = await MessagesAPI.sendMessage(messageData, currentUserId);

      if (result.success && result.data) {
        console.log('✅ Message sent successfully:', result.data);

        // Clear input immediately - real-time will add the message
        setNewMessage('');
        setReplyingTo(null);
        onMessageSent?.(result.data);

        // Note: No need to manually add to state - real-time subscription will handle it!
      } else {
        console.error('Failed to send message:', result.message);
        toast.error(result.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format message time
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours =
      Math.abs(date.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString();
    }
  };

  // Get message status icon
  const getMessageStatusIcon = (message: Message) => {
    if (message.sender_id === currentUserId) {
      return message.is_read ? (
        <CheckCheck className="w-3 h-3 text-blue-500" />
      ) : (
        <Check className="w-3 h-3 text-gray-400" />
      );
    }
    return null;
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    textareaRef.current?.focus();
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        const result = await MessagesAPI.deleteMessage(messageId);
        if (result.success) {
          toast.success('Message deleted successfully');
          setMessages(prev => prev.filter(msg => msg.id !== messageId));
          lastMessageCountRef.current = messages.length - 1;
        } else {
          toast.error(result.message || 'Failed to delete message');
        }
      } catch (error) {
        console.error('Delete message error:', error);
        toast.error('Failed to delete message');
      }
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Loading messages...</p>
        </div>
      </Card>
    );
  }

  if (!otherParticipant) {
    return (
      <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg h-[600px] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">
            No other participant found for this conversation.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg h-[600px] flex flex-col">
      <CardHeader className="pb-4 border-b border-blue-200/50">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="w-8 h-8 p-0 text-blue-600 hover:bg-blue-50">
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <Avatar className="w-10 h-10">
            <AvatarImage src={otherParticipant?.avatar_url} />
            <AvatarFallback className="bg-blue-100 text-blue-700">
              {otherParticipant?.first_name?.[0]}
              {otherParticipant?.last_name?.[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <CardTitle className="text-blue-700 text-lg">
              {otherParticipant?.first_name} {otherParticipant?.last_name}
            </CardTitle>
            {conversation.property && (
              <p className="text-sm text-gray-600">
                {conversation.property.name}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {conversation.property && (
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200">
                {conversation.property.name}
              </Badge>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={refreshMessages}
              className="text-blue-600 hover:bg-blue-50">
              <RefreshCw className="w-4 h-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={refreshMessages}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Messages
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4">
        <ScrollArea className="h-full pr-4">
          <div className="flex flex-col space-y-4">
            {messages.length === 0 && !isLoading ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No messages yet</p>
                <p className="text-sm text-gray-400">
                  Start the conversation by sending a message
                </p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isCurrentUser = message.sender_id === currentUserId;
                const isConsecutive =
                  index > 0 &&
                  messages[index - 1].sender_id === message.sender_id &&
                  new Date(message.created_at).getTime() -
                    new Date(messages[index - 1].created_at).getTime() <
                    5 * 60 * 1000; // 5 minutes

                return (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3',
                      isCurrentUser ? 'justify-end' : 'justify-start',
                      isConsecutive ? 'mt-1' : 'mt-4'
                    )}>
                    {!isCurrentUser && !isConsecutive && (
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={message.sender?.avatar_url} />
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                          {message.sender?.first_name?.[0] || 'U'}
                          {message.sender?.last_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    {isCurrentUser && isConsecutive && <div className="w-8" />}
                    {!isCurrentUser && isConsecutive && <div className="w-8" />}

                    {/* Message Bubble */}
                    <div
                      className={cn(
                        'flex flex-col max-w-xs lg:max-w-md',
                        isCurrentUser ? 'items-end' : 'items-start'
                      )}>
                      {/* Reply Context */}
                      {message.parent_message_id && (
                        <div
                          className={cn(
                            'mb-2 p-2 bg-gray-100 rounded-lg text-xs text-gray-600 max-w-full',
                            isCurrentUser ? 'ml-4' : 'mr-4'
                          )}>
                          <p className="truncate">
                            Replying to:{' '}
                            {
                              messages.find(
                                m => m.id === message.parent_message_id
                              )?.content
                            }
                          </p>
                        </div>
                      )}

                      {/* Message Content */}
                      <div
                        className={cn(
                          'group relative px-4 py-2 rounded-2xl shadow-sm',
                          isCurrentUser
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        )}>
                        <p className="text-sm leading-relaxed">
                          {message.content}
                        </p>

                        {/* Debug indicator for latest message */}
                        {index === messages.length - 1 && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        )}

                        {/* Message Actions */}
                        <div
                          className={cn(
                            'absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity',
                            isCurrentUser ? '-left-12' : '-right-12'
                          )}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-8 h-8 p-0">
                                <MoreVertical className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align={isCurrentUser ? 'end' : 'start'}>
                              <DropdownMenuItem
                                onClick={() => setReplyingTo(message)}>
                                <Reply className="w-4 h-4 mr-2" />
                                Reply
                              </DropdownMenuItem>
                              {isCurrentUser && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDeleteMessage(message.id)
                                  }
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Message Meta */}
                      <div
                        className={cn(
                          'flex items-center gap-1 mt-1 text-xs text-gray-500',
                          isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                        )}>
                        <span>{formatMessageTime(message.created_at)}</span>
                        {getMessageStatusIcon(message)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      {/* Reply Context */}
      {replyingTo && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Reply className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700">
                Replying to {replyingTo.sender?.first_name || 'Unknown'}{' '}
                {replyingTo.sender?.last_name || 'User'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(null)}
              className="w-6 h-6 p-0 text-gray-500 hover:bg-gray-100">
              <X className="w-3 h-3" />
            </Button>
          </div>
          <p className="text-xs text-gray-600 truncate max-w-full mt-1">
            {replyingTo.content}
          </p>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-blue-200/50">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="min-h-[44px] max-h-32 resize-none bg-white/50 border-blue-200/50 focus:border-blue-400"
              rows={1}
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200">
            {isSending ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
