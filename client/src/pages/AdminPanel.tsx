import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, 
  Settings, 
  BarChart3, 
  Shield, 
  MessageSquare, 
  Zap, 
  Bell, 
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Eye,
  Ban,
  Crown,
  Bot,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface User {
  id: number;
  username: string;
  email: string;
  displayName?: string;
  role: 'owner' | 'admin' | 'user';
  isVerified: boolean;
  isAdminApproved: boolean;
  adminRequestPending: boolean;
  adminRequestReason?: string;
  adminRequestAt?: string;
  profilePicture?: string;
  walletBalance: string;
  createdAt: string;
}

interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  pendingAdminRequests: number;
  totalOwners: number;
  recentAdminApprovals: number;
}

interface AIAdminSettings {
  isActive: boolean;
  autoRespond: boolean;
  responseDelay: number;
  escrowAutoApproval: boolean;
  fraudDetection: boolean;
  smartPricing: boolean;
}

export default function AdminPanel() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionDialog, setActionDialog] = useState<{type: string, user: User} | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch admin statistics
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
  });

  // Fetch all users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });

  // Fetch pending admin requests
  const { data: pendingRequests = [] } = useQuery<User[]>({
    queryKey: ['/api/admin/requests'],
  });

  // AI Admin settings
  const [aiSettings, setAiSettings] = useState<AIAdminSettings>({
    isActive: true,
    autoRespond: true,
    responseDelay: 2000,
    escrowAutoApproval: false,
    fraudDetection: true,
    smartPricing: true,
  });

  // Approve admin request mutation
  const approveAdminMutation = useMutation({
    mutationFn: async ({ userId, responseNote }: { userId: number, responseNote?: string }) => {
      return apiRequest('/api/admin/approve', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, response_note: responseNote })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({ title: "Admin request approved successfully" });
      setActionDialog(null);
    },
    onError: (error) => {
      toast({ 
        title: "Failed to approve request", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Deny admin request mutation
  const denyAdminMutation = useMutation({
    mutationFn: async ({ userId, responseNote }: { userId: number, responseNote?: string }) => {
      return apiRequest('/api/admin/deny', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, response_note: responseNote })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({ title: "Admin request denied" });
      setActionDialog(null);
    },
    onError: (error) => {
      toast({ 
        title: "Failed to deny request", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Promote user mutation
  const promoteUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: number, reason?: string }) => {
      return apiRequest('/api/admin/promote', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, reason })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({ title: "User promoted to admin successfully" });
      setActionDialog(null);
    },
    onError: (error) => {
      toast({ 
        title: "Failed to promote user", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Revoke admin mutation
  const revokeAdminMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: number, reason?: string }) => {
      return apiRequest('/api/admin/revoke', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, reason })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({ title: "Admin access revoked successfully" });
      setActionDialog(null);
    },
    onError: (error) => {
      toast({ 
        title: "Failed to revoke admin access", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-500';
      case 'admin': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(parseInt(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-nxe-dark">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-nxe-dark/95 backdrop-blur-md border-b border-nxe-surface">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <Shield className="h-8 w-8 text-nxe-primary" />
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
              <p className="text-sm text-gray-400">Complete control center</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" className="border-nxe-surface">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-nxe-surface"
              onClick={() => window.location.href = '/'}
            >
              Back to App
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid grid-cols-5 bg-nxe-card mb-6">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Admin Requests</span>
            </TabsTrigger>
            <TabsTrigger value="ai-admin" className="flex items-center space-x-2">
              <Bot className="h-4 w-4" />
              <span>AI Admin</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-nxe-card border-nxe-surface">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</div>
                    <Users className="h-5 w-5 text-nxe-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-nxe-card border-nxe-surface">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Active Admins</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-white">{stats?.totalAdmins || 0}</div>
                    <Shield className="h-5 w-5 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-nxe-card border-nxe-surface">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Pending Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-white">{stats?.pendingAdminRequests || 0}</div>
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-nxe-card border-nxe-surface">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">AI Admin Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-nxe-accent">Active</div>
                    <Bot className="h-5 w-5 text-nxe-accent" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-nxe-card border-nxe-surface">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingRequests.slice(0, 5).map(request => (
                    <div key={request.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={request.profilePicture} />
                          <AvatarFallback>{request.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-white font-medium">{request.username}</p>
                          <p className="text-sm text-gray-400">Requested admin access</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-yellow-400 text-yellow-400">
                        Pending
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-nxe-card border-nxe-surface w-80"
                    data-testid="input-search-users"
                  />
                </div>
                <Button variant="outline" size="sm" className="border-nxe-surface">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            <Card className="bg-nxe-card border-nxe-surface">
              <Table>
                <TableHeader>
                  <TableRow className="border-nxe-surface">
                    <TableHead className="text-gray-400">User</TableHead>
                    <TableHead className="text-gray-400">Role</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Wallet</TableHead>
                    <TableHead className="text-gray-400">Joined</TableHead>
                    <TableHead className="text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(user => (
                    <TableRow key={user.id} className="border-nxe-surface">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.profilePicture} />
                            <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-white font-medium">{user.displayName || user.username}</p>
                            <p className="text-sm text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role === 'owner' && <Crown className="h-3 w-3 mr-1" />}
                          {user.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {user.isVerified && (
                            <Badge variant="outline" className="border-green-400 text-green-400">
                              Verified
                            </Badge>
                          )}
                          {user.adminRequestPending && (
                            <Badge variant="outline" className="border-yellow-400 text-yellow-400">
                              Request Pending
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-white">{formatCurrency(user.walletBalance)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-400">{formatDate(user.createdAt)}</span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-nxe-card border-nxe-surface">
                            <DropdownMenuItem 
                              onClick={() => setSelectedUser(user)}
                              className="text-white hover:bg-nxe-surface"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {user.role === 'user' && (
                              <DropdownMenuItem 
                                onClick={() => setActionDialog({type: 'promote', user})}
                                className="text-white hover:bg-nxe-surface"
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Promote to Admin
                              </DropdownMenuItem>
                            )}
                            {user.role === 'admin' && (
                              <DropdownMenuItem 
                                onClick={() => setActionDialog({type: 'revoke', user})}
                                className="text-red-400 hover:bg-nxe-surface"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Revoke Admin
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Admin Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            <Card className="bg-nxe-card border-nxe-surface">
              <CardHeader>
                <CardTitle className="text-white">Pending Admin Requests</CardTitle>
                <p className="text-gray-400">Review and approve admin access requests</p>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-400">No pending admin requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map(request => (
                      <div key={request.id} className="flex items-center justify-between p-4 bg-nxe-surface rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={request.profilePicture} />
                            <AvatarFallback>{request.username.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-white font-medium">{request.displayName || request.username}</p>
                            <p className="text-sm text-gray-400">{request.email}</p>
                            {request.adminRequestReason && (
                              <p className="text-sm text-gray-300 mt-1">
                                <span className="font-medium">Reason:</span> {request.adminRequestReason}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              Requested: {request.adminRequestAt ? formatDate(request.adminRequestAt) : 'Unknown'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => setActionDialog({type: 'approve', user: request})}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            data-testid={`button-approve-${request.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => setActionDialog({type: 'deny', user: request})}
                            variant="destructive"
                            size="sm"
                            data-testid={`button-deny-${request.id}`}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Deny
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Admin Tab */}
          <TabsContent value="ai-admin" className="space-y-6">
            <Card className="bg-nxe-card border-nxe-surface">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Bot className="h-6 w-6 mr-2 text-nxe-accent" />
                  AI Admin Control Center
                </CardTitle>
                <p className="text-gray-400">Configure and control the AI admin system</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="ai-active" className="text-white">AI Admin Active</Label>
                      <Switch 
                        id="ai-active"
                        checked={aiSettings.isActive}
                        onCheckedChange={(checked) => setAiSettings(prev => ({...prev, isActive: checked}))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-respond" className="text-white">Auto Response</Label>
                      <Switch 
                        id="auto-respond"
                        checked={aiSettings.autoRespond}
                        onCheckedChange={(checked) => setAiSettings(prev => ({...prev, autoRespond: checked}))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="escrow-auto" className="text-white">Auto Escrow Approval</Label>
                      <Switch 
                        id="escrow-auto"
                        checked={aiSettings.escrowAutoApproval}
                        onCheckedChange={(checked) => setAiSettings(prev => ({...prev, escrowAutoApproval: checked}))}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="fraud-detection" className="text-white">Fraud Detection</Label>
                      <Switch 
                        id="fraud-detection"
                        checked={aiSettings.fraudDetection}
                        onCheckedChange={(checked) => setAiSettings(prev => ({...prev, fraudDetection: checked}))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="smart-pricing" className="text-white">Smart Pricing</Label>
                      <Switch 
                        id="smart-pricing"
                        checked={aiSettings.smartPricing}
                        onCheckedChange={(checked) => setAiSettings(prev => ({...prev, smartPricing: checked}))}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-nxe-surface">
                  <h3 className="text-white font-medium mb-4">AI Admin Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-nxe-surface border-nxe-border">
                      <CardContent className="p-4 text-center">
                        <MessageSquare className="h-6 w-6 mx-auto text-nxe-accent mb-2" />
                        <p className="text-sm text-gray-400">Messages Handled</p>
                        <p className="text-2xl font-bold text-white">1,247</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-nxe-surface border-nxe-border">
                      <CardContent className="p-4 text-center">
                        <Shield className="h-6 w-6 mx-auto text-green-400 mb-2" />
                        <p className="text-sm text-gray-400">Escrow Processed</p>
                        <p className="text-2xl font-bold text-white">89</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-nxe-surface border-nxe-border">
                      <CardContent className="p-4 text-center">
                        <AlertTriangle className="h-6 w-6 mx-auto text-red-400 mb-2" />
                        <p className="text-sm text-gray-400">Fraud Detected</p>
                        <p className="text-2xl font-bold text-white">12</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-nxe-card border-nxe-surface">
              <CardHeader>
                <CardTitle className="text-white">System Settings</CardTitle>
                <p className="text-gray-400">Configure system-wide settings</p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-400">Advanced settings coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Action Dialogs */}
      {actionDialog && (
        <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
          <DialogContent className="bg-nxe-card border-nxe-surface">
            <DialogHeader>
              <DialogTitle className="text-white">
                {actionDialog.type === 'approve' && 'Approve Admin Request'}
                {actionDialog.type === 'deny' && 'Deny Admin Request'}
                {actionDialog.type === 'promote' && 'Promote to Admin'}
                {actionDialog.type === 'revoke' && 'Revoke Admin Access'}
              </DialogTitle>
              <DialogDescription>
                User: {actionDialog.user.displayName || actionDialog.user.username} ({actionDialog.user.email})
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Textarea
                placeholder="Add a note (optional)"
                className="bg-nxe-surface border-nxe-border"
                data-testid="textarea-action-note"
              />
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setActionDialog(null)}>
                  Cancel
                </Button>
                
                <Button
                  onClick={() => {
                    const note = (document.querySelector('[data-testid="textarea-action-note"]') as HTMLTextAreaElement)?.value;
                    
                    if (actionDialog.type === 'approve') {
                      approveAdminMutation.mutate({ userId: actionDialog.user.id, responseNote: note });
                    } else if (actionDialog.type === 'deny') {
                      denyAdminMutation.mutate({ userId: actionDialog.user.id, responseNote: note });
                    } else if (actionDialog.type === 'promote') {
                      promoteUserMutation.mutate({ userId: actionDialog.user.id, reason: note });
                    } else if (actionDialog.type === 'revoke') {
                      revokeAdminMutation.mutate({ userId: actionDialog.user.id, reason: note });
                    }
                  }}
                  disabled={
                    approveAdminMutation.isPending || 
                    denyAdminMutation.isPending || 
                    promoteUserMutation.isPending || 
                    revokeAdminMutation.isPending
                  }
                  className={
                    actionDialog.type === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                    actionDialog.type === 'deny' || actionDialog.type === 'revoke' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-nxe-primary hover:bg-nxe-primary/80'
                  }
                  data-testid={`button-confirm-${actionDialog.type}`}
                >
                  {actionDialog.type === 'approve' && 'Approve Request'}
                  {actionDialog.type === 'deny' && 'Deny Request'}
                  {actionDialog.type === 'promote' && 'Promote User'}
                  {actionDialog.type === 'revoke' && 'Revoke Access'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}