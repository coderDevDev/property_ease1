'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Send,
  MoreVertical,
  Reply,
  Edit,
  Trash2,
  Phone,
  Video,
  Info,
  ArrowLeft,
  Check,
  CheckCheck,
  Clock
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
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { toast } from 'sonner';

interface ChatInterfaceProps {
  conversation: Conversation;
  currentUserId: string;
  onBack: () => void;
  onMessageSent?: (message: Message) => void;
}

export function ChatInterface({
  conversation,
  currentUserId,
  onBack,
  onMessageSent
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [forceRender, setForceRender] = useState(0); // Force re-render counter
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get the other participant (not current user)
  const otherParticipant = conversation.participants_data.find(
    p => p.id !== currentUserId
  );

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        const result = await MessagesAPI.getConversationMessages(
          conversation.id,
          currentUserId
        );

        if (result.success && result.data) {
          setMessages(result.data);
        } else {
          toast.error('Failed to load messages');
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
        toast.error('Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [conversation.id, currentUserId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Debug: Log messages changes
  useEffect(() => {
    console.log('Messages state updated:', messages.length, 'messages');
    console.log('Latest message:', messages[messages.length - 1]);

    // Force a re-render by updating a dummy state
    if (messages.length > 0) {
      console.log(
        'All messages:',
        messages.map(m => ({ id: m.id, content: m.content.substring(0, 20) }))
      );
    }
  }, [messages]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Real-time messaging
  useRealtimeMessages({
    userId: currentUserId,
    conversations: [conversation],
    selectedConversationId: conversation.id,
    onConversationsUpdate: () => {
      // Conversation updates are handled by parent component
    },
    onMessagesUpdate: newMessages => {
      console.log('Real-time messages update:', newMessages);
      setMessages(newMessages);
    },
    onNewMessage: newMessage => {
      console.log('Real-time new message received:', newMessage);
      console.log('Current conversation ID:', conversation.id);
      console.log('Message conversation ID:', newMessage.conversation_id);

      // Add new message to the list if it belongs to this conversation
      if (newMessage.conversation_id === conversation.id) {
        console.log('Message belongs to current conversation, adding to chat');
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some(msg => msg.id === newMessage.id);
          if (!exists) {
            console.log('Adding new message to chat:', newMessage);

            // Get sender information from conversation participants
            const sender = conversation.participants_data.find(
              p => p.id === newMessage.sender_id
            );

            // Ensure the message has proper sender information
            const messageWithSender = {
              ...newMessage,
              sender: sender || {
                id: newMessage.sender_id,
                first_name: 'Unknown',
                last_name: 'User',
                email: '',
                avatar_url: undefined,
                role: 'user'
              }
            };

            console.log('Message with sender:', messageWithSender);
            const newMessages = [...prev, messageWithSender];
            console.log('New messages array:', newMessages);
            console.log('Total messages after adding:', newMessages.length);

            // Show a toast notification for new messages
            toast.success(
              `New message from ${messageWithSender.sender.first_name}`
            );

            // Force a re-render
            setForceRender(prev => prev + 1);

            return newMessages;
          }
          console.log('Message already exists, skipping:', newMessage.id);
          return prev;
        });
      }
    }
  });

  // Handle sending message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !otherParticipant) return;

    try {
      setIsSending(true);

      const messageData = {
        conversation_id: conversation.id,
        recipient_id: otherParticipant.id,
        property_id: conversation.property_id,
        subject: '',
        content: newMessage.trim(),
        message_type: 'direct' as const,
        attachments: [],
        parent_message_id: replyingTo?.id
      };

      const result = await MessagesAPI.sendMessage(messageData, currentUserId);

      if (result.success && result.data) {
        console.log('Message sent successfully:', result.data);
        setMessages(prev => [...prev, result.data!]);
        setNewMessage('');
        setReplyingTo(null);
        onMessageSent?.(result.data);
        // toast.success('Message sent');
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

  // Optimized: Direct input change without typing detection overhead
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    // Removed typing detection to eliminate input lag
  };

  // Format message time
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

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
    if (message.sender_id !== currentUserId) return null;

    if (message.is_read) {
      return <CheckCheck className="w-3 h-3 text-blue-500" />;
    } else {
      return <Check className="w-3 h-3 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="h-full bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-blue-600 font-medium">Loading messages...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg flex flex-col">
      {/* Chat Header */}
      <CardHeader className="pb-4 border-b border-blue-200/50">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
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
            <h3 className="font-semibold text-gray-900">
              {otherParticipant?.first_name} {otherParticipant?.last_name}
            </h3>
            <p className="text-sm text-gray-600 capitalize">
              {otherParticipant?.role}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {conversation.property && (
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200">
                {conversation.property.name}
              </Badge>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Video className="w-4 h-4 mr-2" />
                  Video Call
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Info className="w-4 h-4 mr-2" />
                  View Profile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      {/* Messages Area */}
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Start a conversation
                </h3>
                <p className="text-gray-600">
                  Send a message to begin your conversation
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
                      isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                    )}>
                    {/* Avatar */}
                    {!isConsecutive && (
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={message.sender?.avatar_url} />
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                          {message.sender?.first_name?.[0] || 'U'}
                          {message.sender?.last_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    {isConsecutive && <div className="w-8" />}

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

                        {/* Debug indicator for new messages */}
                        {message.id === messages[messages.length - 1]?.id && (
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
                                <>
                                  <DropdownMenuItem>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
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

            {/* Typing Indicator */}
            {otherUserTyping && (
              <div className="flex gap-3">
                <div className="w-8" />
                <div className="flex flex-col max-w-xs lg:max-w-md">
                  <div className="px-4 py-2 bg-gray-100 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-1">
                      <div className="flex gap-1">
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0ms' }}></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: '150ms' }}></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-xs text-gray-500 ml-2">
                        {otherParticipant?.first_name} is typing...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
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
              className="text-blue-600 hover:text-blue-700">
              Cancel
            </Button>
          </div>
          <p className="text-xs text-gray-600 mt-1 truncate">
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
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="min-h-[44px] max-h-32 resize-none bg-white/50 border-blue-200/50 focus:border-blue-400"
              rows={1}
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4">
            {isSending ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
