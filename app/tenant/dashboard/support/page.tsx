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
  HelpCircle,
  Search,
  Plus,
  Calendar,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  Send,
  FileText,
  Link,
  ExternalLink,
  Mail,
  Phone,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { TenantAPI } from '@/lib/api/tenant';

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  messages: {
    id: string;
    user_id: string;
    user_name: string;
    content: string;
    created_at: string;
    is_staff: boolean;
  }[];
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function SupportPage() {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [showNewTicketDialog, setShowNewTicketDialog] = useState(false);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null
  );
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium'
  });
  const [newMessage, setNewMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedFAQs, setExpandedFAQs] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!authState.user?.id) return;

      try {
        setLoading(true);
        const [ticketsResult, faqsResult] = await Promise.all([
          TenantAPI.getSupportTickets(authState.user.id),
          TenantAPI.getFAQs()
        ]);

        if (ticketsResult.success && ticketsResult.data) {
          setTickets(ticketsResult.data);
        } else {
          toast.error('Failed to load support tickets');
        }

        if (faqsResult.success && faqsResult.data) {
          setFaqs(faqsResult.data);
        } else {
          toast.error('Failed to load FAQs');
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authState.user?.id]);

  const handleCreateTicket = async () => {
    if (
      !authState.user?.id ||
      !newTicket.title ||
      !newTicket.description ||
      !newTicket.category
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const result = await TenantAPI.createSupportTicket(
        newTicket.title,
        newTicket.description,
        newTicket.category,
        newTicket.priority
      );

      if (result.success && result.data) {
        setTickets(prev => [result.data, ...prev]);
        setShowNewTicketDialog(false);
        setNewTicket({
          title: '',
          description: '',
          category: '',
          priority: 'medium'
        });
        toast.success('Support ticket created successfully');
      } else {
        toast.error(result.message || 'Failed to create ticket');
      }
    } catch (error) {
      console.error('Failed to create ticket:', error);
      toast.error('Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return;

    try {
      setSubmitting(true);
      const result = await TenantAPI.addSupportTicketMessage(
        selectedTicket.id,
        newMessage
      );

      if (result.success && result.data) {
        setTickets(prev =>
          prev.map(ticket =>
            ticket.id === selectedTicket.id
              ? {
                  ...ticket,
                  messages: [...ticket.messages, result.data],
                  updated_at: new Date().toISOString()
                }
              : ticket
          )
        );
        setNewMessage('');
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

  const handleCloseTicket = async (ticketId: string) => {
    try {
      const result = await TenantAPI.closeSupportTicket(ticketId);
      if (result.success) {
        setTickets(prev =>
          prev.map(ticket =>
            ticket.id === ticketId ? { ...ticket, status: 'closed' } : ticket
          )
        );
        toast.success('Ticket closed successfully');
      } else {
        toast.error(result.message || 'Failed to close ticket');
      }
    } catch (error) {
      console.error('Failed to close ticket:', error);
      toast.error('Failed to close ticket');
    }
  };

  const toggleFAQ = (faqId: string) => {
    setExpandedFAQs(prev =>
      prev.includes(faqId) ? prev.filter(id => id !== faqId) : [...prev, faqId]
    );
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesFilter = filter === 'all' || ticket.status === filter;
    const matchesSearch =
      searchQuery === '' ||
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-700';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'resolved':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-green-100 text-green-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading support center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Support Center
        </h1>
        <p className="text-gray-600">
          Get help and support for your questions and issues
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Email Support</h3>
                <p className="text-sm text-gray-600">
                  support@propertyease.com
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Phone className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Phone Support</h3>
                <p className="text-sm text-gray-600">+1 (555) 123-4567</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Business Hours</h3>
                <p className="text-sm text-gray-600">
                  Mon-Fri, 9:00 AM - 5:00 PM
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Support Tickets */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Support Tickets
          </h2>
          <Button
            onClick={() => setShowNewTicketDialog(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex gap-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tickets</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
          </div>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
          <CardContent className="p-0">
            {filteredTickets.length === 0 ? (
              <div className="text-center py-8">
                <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Tickets Found
                </h3>
                <p className="text-gray-600">
                  {searchQuery
                    ? 'No tickets match your search criteria'
                    : 'You haven not created any support tickets yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredTickets.map(ticket => (
                  <div
                    key={ticket.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setShowTicketDialog(true);
                    }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">
                          {ticket.title}
                        </h3>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status.charAt(0).toUpperCase() +
                            ticket.status.slice(1)}
                        </Badge>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority.charAt(0).toUpperCase() +
                            ticket.priority.slice(1)}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-600 line-clamp-2">
                      {ticket.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {ticket.messages.length} messages
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Last updated:{' '}
                        {new Date(ticket.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* FAQs */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Frequently Asked Questions
        </h2>
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
          <CardContent className="p-0">
            {faqs.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No FAQs Available
                </h3>
                <p className="text-gray-600">
                  Check back later for helpful information
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {faqs.map(faq => (
                  <div key={faq.id} className="p-4">
                    <button
                      className="w-full flex items-center justify-between text-left"
                      onClick={() => toggleFAQ(faq.id)}>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-700 border-0">
                          {faq.category}
                        </Badge>
                        <h3 className="font-medium text-gray-900">
                          {faq.question}
                        </h3>
                      </div>
                      {expandedFAQs.includes(faq.id) ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                    {expandedFAQs.includes(faq.id) && (
                      <div className="mt-4 text-gray-600 prose max-w-none">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Ticket Dialog */}
      <Dialog open={showNewTicketDialog} onOpenChange={setShowNewTicketDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={newTicket.title}
                onChange={e =>
                  setNewTicket(prev => ({ ...prev, title: e.target.value }))
                }
                placeholder="Brief description of your issue"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={newTicket.category}
                onValueChange={value =>
                  setNewTicket(prev => ({ ...prev, category: value }))
                }>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="property">Property</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={newTicket.priority}
                onValueChange={(value: any) =>
                  setNewTicket(prev => ({ ...prev, priority: value }))
                }>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newTicket.description}
                onChange={e =>
                  setNewTicket(prev => ({
                    ...prev,
                    description: e.target.value
                  }))
                }
                placeholder="Detailed description of your issue"
                className="min-h-[200px]"
              />
            </div>
            <Button
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              onClick={handleCreateTicket}
              disabled={submitting}>
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Creating...
                </>
              ) : (
                'Create Ticket'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ticket Details Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Support Ticket Details</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-6 py-4">
              {/* Ticket Info */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedTicket.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getStatusColor(selectedTicket.status)}>
                        {selectedTicket.status.charAt(0).toUpperCase() +
                          selectedTicket.status.slice(1)}
                      </Badge>
                      <Badge
                        className={getPriorityColor(selectedTicket.priority)}>
                        {selectedTicket.priority.charAt(0).toUpperCase() +
                          selectedTicket.priority.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  {selectedTicket.status !== 'closed' && (
                    <Button
                      variant="outline"
                      className="border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => {
                        handleCloseTicket(selectedTicket.id);
                        setShowTicketDialog(false);
                      }}>
                      Close Ticket
                    </Button>
                  )}
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedTicket.description}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Messages</h4>
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {selectedTicket.messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.is_staff ? 'flex-row' : 'flex-row-reverse'
                      }`}>
                      <div
                        className={`flex-1 p-4 rounded-lg ${
                          message.is_staff ? 'bg-gray-50' : 'bg-blue-50'
                        }`}>
                        <div className="flex items-center justify-between mb-2">
                          <p
                            className={`font-medium ${
                              message.is_staff
                                ? 'text-gray-900'
                                : 'text-blue-900'
                            }`}>
                            {message.user_name}
                          </p>
                          <span className="text-sm text-gray-500">
                            {new Date(message.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p
                          className={
                            message.is_staff ? 'text-gray-700' : 'text-blue-700'
                          }>
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedTicket.status !== 'closed' && (
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleAddMessage}
                      disabled={!newMessage.trim() || submitting}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                      {submitting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
