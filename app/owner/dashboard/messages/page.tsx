'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  Plus,
  Search,
  Mail,
  MailOpen,
  Archive,
  Trash2,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Send,
  Reply,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  MessagesAPI,
  type Conversation,
  type Message
} from '@/lib/api/messages';
import { ConversationList } from '@/components/messages/conversation-list';
import { SimpleChatInterface } from '@/components/messages/simple-chat-interface';
import { MessageForm } from '@/components/messages/message-form';
import { DebugRealtime } from '@/components/messages/debug-realtime';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { toast } from 'sonner';

export default function OwnerMessagesPage() {
  const { authState } = useAuth();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total_conversations: 0,
    unread_messages: 0,
    total_messages: 0,
    recent_activity: 0
  });

  // Load conversations and stats
  useEffect(() => {
    const loadData = async () => {
      if (!authState.user?.id) return;

      try {
        setIsLoading(true);
        const [conversationsResult, statsResult] = await Promise.all([
          MessagesAPI.getConversations(authState.user.id),
          MessagesAPI.getMessageStats(authState.user.id)
        ]);

        if (conversationsResult.success) {
          setConversations(conversationsResult.data || []);
        }

        if (statsResult.success) {
          setStats(statsResult.data || stats);
        }
      } catch (error) {
        console.error('Failed to load messages data:', error);
        toast.error('Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [authState.user?.id]);

  // Poll for conversation updates every 5 seconds
  useEffect(() => {
    if (!authState.user?.id) return;

    const pollConversations = async () => {
      try {
        const conversationsResult = await MessagesAPI.getConversations(
          authState.user?.id || ''
        );
        if (conversationsResult.success) {
          setConversations(conversationsResult.data || []);
        }
      } catch (error) {
        console.error('Failed to poll conversations:', error);
      }
    };

    // Start polling after initial load
    const interval = setInterval(pollConversations, 5000);

    return () => clearInterval(interval);
  }, [authState.user?.id]);

  // Load messages for selected conversation
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversation || !authState.user?.id) return;

      try {
        setIsLoadingMessages(true);
        const result = await MessagesAPI.getConversationMessages(
          selectedConversation.id,
          authState.user.id
        );

        if (result.success) {
          setMessages(result.data || []);
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
        toast.error('Failed to load messages');
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [selectedConversation, authState.user?.id]);

  // Real-time messaging
  useRealtimeMessages({
    userId: authState.user?.id || '',
    onNewMessage: message => {
      // Handle new message notification
      console.log('New message received:', message);
      // Refresh conversations when a new message is received
      if (authState.user?.id) {
        MessagesAPI.getConversations(authState.user.id).then(result => {
          if (result.success) {
            setConversations(result.data || []);
          }
        });
      }
    },
    onMessageUpdate: message => {
      // Handle message update
      console.log('Message updated:', message);
    }
  });

  // Handle conversation selection
  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowNewMessageForm(false);
  };

  // Handle new message
  const handleNewMessage = () => {
    setShowNewMessageForm(true);
    setSelectedConversation(null);
  };

  // Handle message sent
  const handleMessageSent = (message: any) => {
    // toast.success('Message sent successfully');
    setShowNewMessageForm(false);

    // Refresh conversations
    if (authState.user?.id) {
      MessagesAPI.getConversations(authState.user.id).then(result => {
        if (result.success) {
          setConversations(result.data || []);
        }
      });
    }
  };

  // Refresh conversations manually
  const refreshConversations = async () => {
    if (!authState.user?.id) return;

    try {
      const result = await MessagesAPI.getConversations(authState.user.id);
      if (result.success) {
        setConversations(result.data || []);
        toast.success('Conversations refreshed');
      }
    } catch (error) {
      console.error('Failed to refresh conversations:', error);
      toast.error('Failed to refresh conversations');
    }
  };

  // Handle reply to message
  const handleReply = (message: Message) => {
    setSelectedConversation({
      id: message.conversation_id,
      participants: [message.sender_id, message.recipient_id],
      participants_data: [message.sender, message.recipient],
      property_id: message.property_id,
      property: message.property,
      is_active: true,
      created_at: '',
      updated_at: '',
      unread_count: 0
    });
    setShowNewMessageForm(false);
  };

  // Handle delete message
  const handleDeleteMessage = async (messageId: string) => {
    try {
      const result = await MessagesAPI.deleteMessage(messageId);
      if (result.success) {
        toast.success('Message deleted successfully');
        // Refresh messages
        if (selectedConversation && authState.user?.id) {
          const messagesResult = await MessagesAPI.getConversationMessages(
            selectedConversation.id,
            authState.user.id
          );
          if (messagesResult.success) {
            setMessages(messagesResult.data || []);
          }
        }
      } else {
        toast.error(result.message || 'Failed to delete message');
      }
    } catch (error) {
      console.error('Delete message error:', error);
      toast.error('Failed to delete message');
    }
  };

  // Handle archive conversation
  const handleArchiveConversation = async (conversationId: string) => {
    try {
      const result = await MessagesAPI.archiveConversation(conversationId);
      if (result.success) {
        toast.success('Conversation archived successfully');
        // Remove from conversations list
        setConversations(prev => prev.filter(c => c.id !== conversationId));
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(null);
        }
      } else {
        toast.error(result.message || 'Failed to archive conversation');
      }
    } catch (error) {
      console.error('Archive conversation error:', error);
      toast.error('Failed to archive conversation');
    }
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conversation => {
    const searchLower = searchTerm.toLowerCase();
    const otherParticipant = conversation.participants_data.find(
      p => p.id !== authState.user?.id
    );

    return (
      conversation.property?.name.toLowerCase().includes(searchLower) ||
      otherParticipant?.first_name.toLowerCase().includes(searchLower) ||
      otherParticipant?.last_name.toLowerCase().includes(searchLower) ||
      conversation.last_message?.content.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-3 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-blue-600 font-medium text-sm sm:text-base">Loading messages...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
              Messages
            </h1>
            <p className="text-blue-600/70 mt-1 text-sm sm:text-base">
              Communicate with your tenants
            </p>
          </div>
          <Button
            onClick={handleNewMessage}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base">
            <Plus className="w-4 h-4 mr-2" />
            New Message
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {stats.total_conversations}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Total Conversations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-yellow-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {stats.unread_messages}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Unread Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {stats.total_messages}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Total Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {filteredConversations.length}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Active Conversations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <ConversationList
              conversations={filteredConversations}
              selectedConversationId={selectedConversation?.id}
              role="owner"
              currentUserId={authState.user?.id || ''}
              onSelectConversation={handleSelectConversation}
              onNewMessage={handleNewMessage}
              onArchiveConversation={handleArchiveConversation}
              onRefresh={refreshConversations}
            />
          </div>

          {/* Messages Area */}
          <div className="lg:col-span-2">
            {showNewMessageForm ? (
              <MessageForm
                role="owner"
                currentUserId={authState.user?.id || ''}
                onMessageSent={handleMessageSent}
                onCancel={() => setShowNewMessageForm(false)}
              />
            ) : selectedConversation ? (
              <SimpleChatInterface
                conversation={selectedConversation}
                currentUserId={authState.user?.id || ''}
                onBack={() => setSelectedConversation(null)}
                onMessageSent={handleMessageSent}
              />
            ) : (
              <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg h-[400px] sm:h-[500px] lg:h-[600px]">
                <CardContent className="flex items-center justify-center h-full p-4 sm:p-6">
                  <div className="text-center">
                    <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-6">
                      Choose a conversation from the list to view messages
                    </p>
                    <Button
                      onClick={handleNewMessage}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm sm:text-base">
                      <Plus className="w-4 h-4 mr-2" />
                      Start New Conversation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Debug Component - Remove in production */}
      {/* {authState.user?.id && <DebugRealtime userId={authState.user.id} />} */}
    </div>
  );
}
