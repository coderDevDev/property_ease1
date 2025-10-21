'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  UserCheck,
  UserX,
  Edit,
  Shield,
  Building,
  Home,
  Eye,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { AdminAPI } from '@/lib/api/admin';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'owner' | 'tenant' | 'admin';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login?: string;
  updated_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Calculate stats
  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    verified: users.filter(u => u.is_verified).length,
    admins: users.filter(u => u.role === 'admin').length,
    owners: users.filter(u => u.role === 'owner').length,
    tenants: users.filter(u => u.role === 'tenant').length
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const roleParam = roleFilter !== 'all' ? roleFilter : undefined;
      const statusParam =
        statusFilter !== 'all' ? statusFilter === 'active' : undefined;

      const result = await AdminAPI.getAllUsers(roleParam, statusParam);
      if (result.success) {
        setUsers(result.data);
      } else {
        toast.error('Failed to load users');
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, isActive: boolean) => {
    try {
      const result = await AdminAPI.updateUserStatus(userId, isActive);
      if (result.success) {
        toast.success(
          `User ${isActive ? 'activated' : 'deactivated'} successfully`
        );
        loadUsers();
      } else {
        toast.error(result.message || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Failed to update user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleRoleChange = async (
    userId: string,
    newRole: 'owner' | 'tenant' | 'admin'
  ) => {
    try {
      const result = await AdminAPI.updateUserRole(userId, newRole);
      if (result.success) {
        toast.success('User role updated successfully');
        loadUsers();
        setIsEditDialogOpen(false);
      } else {
        toast.error(result.message || 'Failed to update user role');
      }
    } catch (error) {
      console.error('Failed to update user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'owner':
        return <Building className="w-4 h-4" />;
      case 'tenant':
        return <Home className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'owner':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'tenant':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
              User Management
            </h1>
            <p className="text-blue-600/70 mt-1 text-sm sm:text-base">
              Manage all user accounts and permissions
            </p>
          </div>
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 self-start sm:self-auto">
            <Users className="w-3 h-3 mr-1" />
            {filteredUsers.length} Users
          </Badge>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Building className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.owners}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Owners</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Home className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.tenants}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Tenants</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-red-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.admins}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Admins</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search Users</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="role-filter">Filter by Role</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Administrators</SelectItem>
                    <SelectItem value="owner">Property Owners</SelectItem>
                    <SelectItem value="tenant">Tenants</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status-filter">Filter by Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white/70 backdrop-blur-sm border-blue-200/50">
            <TabsTrigger value="all" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              All Users
              <Badge className="ml-2 bg-blue-100 text-blue-700">{users.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="unverified" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white">
              Unverified
              <Badge className="ml-2 bg-yellow-100 text-yellow-700">
                {users.filter(u => !u.is_verified).length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
        {/* All Users Table */}
        <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="text-xs text-gray-400">
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${getRoleBadgeColor(
                            user.role
                          )} capitalize`}>
                          {getRoleIcon(user.role)}
                          <span className="ml-1">{user.role}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.is_active ? 'default' : 'secondary'}
                          className={
                            user.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.is_verified ? 'default' : 'secondary'}
                          className={
                            user.is_verified
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }>
                          {user.is_verified ? 'Verified' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.last_login
                          ? new Date(user.last_login).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setIsViewDialogOpen(true);
                              }}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setIsEditDialogOpen(true);
                              }}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Role
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(user.id, !user.is_active)
                              }>
                              {user.is_active ? (
                                <>
                                  <UserX className="w-4 h-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No users found
                </h3>
                <p className="text-gray-600">
                  {searchTerm
                    ? 'Try adjusting your search criteria.'
                    : 'No users match the current filters.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="unverified">
            {/* Unverified Users Table */}
            <Card className="bg-white/70 backdrop-blur-sm border-yellow-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  Unverified Users ({users.filter(u => !u.is_verified).length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Registered</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.filter(u => !u.is_verified).map(user => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900">
                                {user.first_name} {user.last_name}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                              {user.phone && (
                                <div className="text-xs text-gray-400">{user.phone}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${getRoleBadgeColor(user.role)} capitalize`}>
                              {getRoleIcon(user.role)}
                              <span className="ml-1">{user.role}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={user.is_active ? 'default' : 'secondary'}
                              className={
                                user.is_active
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-500">
                              {new Date(user.created_at).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsViewDialogOpen(true);
                                }}>
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleVerifyUser(user.id)}>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Verify
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                                onClick={() => handleRequestDocuments(user.id)}>
                                <AlertCircle className="w-4 h-4 mr-1" />
                                Request Docs
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {users.filter(u => !u.is_verified).length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        All users verified!
                      </h3>
                      <p className="text-gray-600">No users pending verification at this time.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* View User Details Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Details
              </DialogTitle>
              <DialogDescription>
                Complete information for {selectedUser?.first_name}{' '}
                {selectedUser?.last_name}
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                  <TabsTrigger value="stats">Statistics</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-4">
                  <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50">
                    <CardHeader>
                      <CardTitle className="text-lg">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-600">Full Name</Label>
                          <p className="font-medium">{selectedUser.first_name} {selectedUser.last_name}</p>
                        </div>
                        <div>
                          <Label className="text-gray-600">Email</Label>
                          <p className="font-medium">{selectedUser.email}</p>
                        </div>
                        <div>
                          <Label className="text-gray-600">Phone</Label>
                          <p className="font-medium">{selectedUser.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label className="text-gray-600">Role</Label>
                          <Badge className={getRoleBadgeColor(selectedUser.role)}>
                            {getRoleIcon(selectedUser.role)}
                            <span className="ml-1 capitalize">{selectedUser.role}</span>
                          </Badge>
                        </div>
                        <div>
                          <Label className="text-gray-600">Status</Label>
                          <Badge className={selectedUser.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                            {selectedUser.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div>
                          <Label className="text-gray-600">Verification</Label>
                          <Badge className={selectedUser.is_verified ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}>
                            {selectedUser.is_verified ? 'Verified' : 'Pending'}
                          </Badge>
                        </div>
                        <div>
                          <Label className="text-gray-600">User ID</Label>
                          <p className="font-mono text-xs">{selectedUser.id}</p>
                        </div>
                        <div>
                          <Label className="text-gray-600">Member Since</Label>
                          <p className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="activity" className="space-y-4">
                  <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50">
                    <CardHeader>
                      <CardTitle className="text-lg">Activity Log</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-2 border-b">
                          <span className="text-sm text-gray-600">Last Login</span>
                          <span className="font-medium">
                            {selectedUser.last_login
                              ? new Date(selectedUser.last_login).toLocaleString()
                              : 'Never logged in'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b">
                          <span className="text-sm text-gray-600">Account Created</span>
                          <span className="font-medium">
                            {new Date(selectedUser.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b">
                          <span className="text-sm text-gray-600">Last Updated</span>
                          <span className="font-medium">
                            {new Date(selectedUser.updated_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-700">
                            📊 <strong>Note:</strong> Detailed activity logs (login history, actions performed) will be available in the next update.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="security" className="space-y-4">
                  <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50">
                    <CardHeader>
                      <CardTitle className="text-lg">Security Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Email Verified</p>
                            <p className="text-sm text-gray-600">User email verification status</p>
                          </div>
                          <Badge className={selectedUser.is_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                            {selectedUser.is_verified ? '✓ Verified' : '⏳ Pending'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Account Status</p>
                            <p className="text-sm text-gray-600">Current account access status</p>
                          </div>
                          <Badge className={selectedUser.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                            {selectedUser.is_active ? '✓ Active' : '✗ Suspended'}
                          </Badge>
                        </div>
                        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                          <p className="text-sm text-yellow-700">
                            🔐 <strong>Security Features Coming Soon:</strong><br/>
                            • Two-Factor Authentication (2FA)<br/>
                            • Login History & Device Tracking<br/>
                            • Password Reset Management<br/>
                            • Session Management
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="stats" className="space-y-4">
                  <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50">
                    <CardHeader>
                      <CardTitle className="text-lg">User Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-600">Account Age</p>
                          <p className="text-2xl font-bold text-blue-700">
                            {Math.floor((new Date().getTime() - new Date(selectedUser.created_at).getTime()) / (1000 * 60 * 60 * 24))} days
                          </p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <p className="text-sm text-gray-600">Role Type</p>
                          <p className="text-2xl font-bold text-green-700 capitalize">{selectedUser.role}</p>
                        </div>
                        <div className="col-span-2 mt-4 p-4 bg-purple-50 rounded-lg">
                          <p className="text-sm text-purple-700">
                            📈 <strong>Advanced Statistics Coming Soon:</strong><br/>
                            • Properties managed (for owners)<br/>
                            • Rental history (for tenants)<br/>
                            • Payment statistics<br/>
                            • Maintenance requests submitted<br/>
                            • Platform engagement metrics
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User Role</DialogTitle>
              <DialogDescription>
                Change the role for {selectedUser?.first_name}{' '}
                {selectedUser?.last_name}
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="current-role">Current Role</Label>
                  <div className="mt-1">
                    <Badge className={getRoleBadgeColor(selectedUser.role)}>
                      {getRoleIcon(selectedUser.role)}
                      <span className="ml-1 capitalize">{selectedUser.role}</span>
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label htmlFor="new-role">New Role</Label>
                  <Select
                    defaultValue={selectedUser.role}
                    onValueChange={(value: 'owner' | 'tenant' | 'admin') =>
                      handleRoleChange(selectedUser.id, value)
                    }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="owner">Property Owner</SelectItem>
                      <SelectItem value="tenant">Tenant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );

  async function handleVerifyUser(userId: string) {
    try {
      const result = await AdminAPI.verifyUser(userId);
      if (result.success) {
        toast.success('User verified successfully!');
        loadUsers();
      } else {
        toast.error(result.message || 'Failed to verify user');
      }
    } catch (error) {
      toast.error('Failed to verify user');
      console.error('Verify error:', error);
    }
  }

  async function handleRequestDocuments(userId: string) {
    try {
      const result = await AdminAPI.requestVerificationDocuments(userId);
      if (result.success) {
        toast.success('Document request sent to user via email.');
        loadUsers();
      } else {
        toast.error(result.message || 'Failed to send document request');
      }
    } catch (error) {
      toast.error('Failed to send document request');
      console.error('Request documents error:', error);
    }
  }
}
