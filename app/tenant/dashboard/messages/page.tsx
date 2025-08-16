'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  MessageSquare,
  Search,
  Plus,
  Calendar,
  User,
  Send,
  Inbox,
  Archive,
  Star,
  Trash2,
  Mail,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { TenantAPI } from '@/lib/api/tenant';

interface Message {
  id: string;
  subject: string;
  content: string;
  sender_id: string;
  sender_name: string;
  recipient_id: string;
  recipient_name: string;
  created_at: string;
  is_read: boolean;
  is_archived: boolean;
  is_starred: boolean;
}

interface MessageFolder {
  id: string;
  name: string;
  icon: any;
  filter: (message: Message) => boolean;
}

export default function MessagesPage() {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [newMessage, setNewMessage] = useState({
    recipient_id: '',
    subject: '',
    content: ''
  });
  const [availableRecipients, setAvailableRecipients] = useState<
    {
      id: string;
      name: string;
      role: string;
    }[]
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const folders: MessageFolder[] = [
    {
      id: 'inbox',
      name: 'Inbox',
      icon: Inbox,
      filter: message => !message.is_archived && !message.is_starred
    },
    {
      id: 'starred',
      name: 'Starred',
      icon: Star,
      filter: message => message.is_starred
    },
    {
      id: 'archived',
      name: 'Archived',
      icon: Archive,
      filter: message => message.is_archived
    }
  ];

  useEffect(() => {
    const fetchMessages = async () => {
      if (!authState.user?.id) return;

      try {
        setLoading(true);
        const result = await TenantAPI.getMessages(authState.user.id);

        if (result.success && result.data) {
          setMessages(result.data);
        } else {
          toast.error('Failed to load messages');
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        toast.error('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    const fetchRecipients = async () => {
      try {
        const result = await TenantAPI.getAvailableRecipients();
        if (result.success && result.data) {
          setAvailableRecipients(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch recipients:', error);
      }
    };

    fetchMessages();
    fetchRecipients();
  }, [authState.user?.id]);

  const handleSendMessage = async () => {
    if (
      !authState.user?.id ||
      !newMessage.recipient_id ||
      !newMessage.subject ||
      !newMessage.content.trim()
    ) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      const result = await TenantAPI.sendMessage(
        newMessage.recipient_id,
        newMessage.subject,
        newMessage.content
      );

      if (result.success && result.data) {
        setMessages(prev => [result.data, ...prev]);
        setShowNewMessageDialog(false);
        setNewMessage({ recipient_id: '', subject: '', content: '' });
        toast.success('Message sent successfully');
      } else {
        toast.error(result.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!selectedMessage || !replyContent.trim()) return;

    try {
      setSubmitting(true);
      const result = await TenantAPI.sendMessage(
        selectedMessage.sender_id,
        `Re: ${selectedMessage.subject}`,
        replyContent
      );

      if (result.success && result.data) {
        setMessages(prev => [result.data, ...prev]);
        setReplyContent('');
        toast.success('Reply sent successfully');
      } else {
        toast.error(result.message || 'Failed to send reply');
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMessageAction = async (
    messageId: string,
    action: 'star' | 'archive' | 'unarchive' | 'delete'
  ) => {
    try {
      const result = await TenantAPI.updateMessage(messageId, action);
      if (result.success) {
        setMessages(prev =>
          prev
            .map(message =>
              message.id === messageId
                ? {
                    ...message,
                    is_starred:
                      action === 'star'
                        ? !message.is_starred
                        : message.is_starred,
                    is_archived:
                      action === 'archive'
                        ? true
                        : action === 'unarchive'
                        ? false
                        : message.is_archived
                  }
                : message
            )
            .filter(message => action !== 'delete' || message.id !== messageId)
        );
        toast.success(`Message ${action}d successfully`);
      } else {
        toast.error(result.message || `Failed to ${action} message`);
      }
    } catch (error) {
      console.error(`Failed to ${action} message:`, error);
      toast.error(`Failed to ${action} message`);
    }
  };

  const handleOpenMessage = async (message: Message) => {
    setSelectedMessage(message);
    setShowMessageDialog(true);

    if (!message.is_read) {
      try {
        await TenantAPI.markMessageAsRead(message.id);
        setMessages(prev =>
          prev.map(m => (m.id === message.id ? { ...m, is_read: true } : m))
        );
      } catch (error) {
        console.error('Failed to mark message as read:', error);
      }
    }
  };

  const filteredMessages = messages
    .filter(folders.find(f => f.id === selectedFolder)?.filter || (() => true))
    .filter(
      message =>
        searchQuery === '' ||
        message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.sender_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Messages</h1>
          <p className="text-gray-600">
            Communicate with your property manager and landlord
          </p>
        </div>
        <Button
          onClick={() => setShowNewMessageDialog(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Message
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Folders */}
        <div className="w-full md:w-48 space-y-2">
          {folders.map(folder => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolder(folder.id)}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                selectedFolder === folder.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}>
              <folder.icon className="w-4 h-4" />
              <span className="font-medium">{folder.name}</span>
              {folder.id === 'inbox' && (
                <Badge className="ml-auto bg-blue-100 text-blue-700 border-0">
                  {messages.filter(m => !m.is_read && !m.is_archived).length}
                </Badge>
              )}
            </button>
          ))}
        </div>

        {/* Messages List */}
        <div className="flex-1">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
          </div>

          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
            <CardContent className="p-0">
              {filteredMessages.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Messages Found
                  </h3>
                  <p className="text-gray-600">
                    {searchQuery
                      ? 'No messages match your search criteria'
                      : 'You have no messages in this folder'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredMessages.map(message => (
                    <div
                      key={message.id}
                      onClick={() => handleOpenMessage(message)}
                      className={`flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !message.is_read ? 'bg-blue-50' : ''
                      }`}>
                      <div className="flex-shrink-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            !message.is_read ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                          <User
                            className={`w-5 h-5 ${
                              !message.is_read
                                ? 'text-blue-600'
                                : 'text-gray-600'
                            }`}
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className={`font-medium ${
                              !message.is_read
                                ? 'text-gray-900'
                                : 'text-gray-700'
                            }`}>
                            {message.sender_name}
                          </p>
                          <span className="text-sm text-gray-500">
                            {new Date(message.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p
                          className={`truncate ${
                            !message.is_read
                              ? 'font-medium text-gray-900'
                              : 'text-gray-700'
                          }`}>
                          {message.subject}
                        </p>
                        <p className="truncate text-sm text-gray-500">
                          {message.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {message.is_starred && (
                          <Star className="w-4 h-4 text-yellow-500" />
                        )}
                        {!message.is_read && (
                          <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Message Dialog */}
      <Dialog
        open={showNewMessageDialog}
        onOpenChange={setShowNewMessageDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>To</Label>
              <Select
                value={newMessage.recipient_id}
                onValueChange={value =>
                  setNewMessage(prev => ({ ...prev, recipient_id: value }))
                }>
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  {availableRecipients.map(recipient => (
                    <SelectItem key={recipient.id} value={recipient.id}>
                      {recipient.name} ({recipient.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={newMessage.subject}
                onChange={e =>
                  setNewMessage(prev => ({ ...prev, subject: e.target.value }))
                }
                placeholder="Enter message subject"
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={newMessage.content}
                onChange={e =>
                  setNewMessage(prev => ({ ...prev, content: e.target.value }))
                }
                placeholder="Type your message here"
                className="min-h-[200px]"
              />
            </div>
            <Button
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              onClick={handleSendMessage}
              disabled={submitting}>
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Message Details Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Message Details</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedMessage.sender_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(selectedMessage.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                    onClick={() =>
                      handleMessageAction(selectedMessage.id, 'star')
                    }>
                    <Star
                      className={`w-4 h-4 ${
                        selectedMessage.is_starred ? 'fill-yellow-500' : ''
                      }`}
                    />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    onClick={() =>
                      handleMessageAction(
                        selectedMessage.id,
                        selectedMessage.is_archived ? 'unarchive' : 'archive'
                      )
                    }>
                    <Archive className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                    onClick={() => {
                      handleMessageAction(selectedMessage.id, 'delete');
                      setShowMessageDialog(false);
                    }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {selectedMessage.subject}
                </h3>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedMessage.content}
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-200">
                <Label>Reply</Label>
                <Textarea
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value)}
                  placeholder="Type your reply here"
                  className="min-h-[100px]"
                />
                <Button
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  onClick={handleReply}
                  disabled={submitting || !replyContent.trim()}>
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Reply
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
