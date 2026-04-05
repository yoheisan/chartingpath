import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserPlus, Shield, Search, Trash2, Loader2, Copy, Check, Activity } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

interface User {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
  subscription_plan: string;
  subscription_status: string;
  role?: string;
  last_sign_in_at?: string | null;
  last_login_ip?: string | null;
  last_login_location?: string | null;
  last_active_at?: string | null;
  active_days_7d?: number;
  active_days_30d?: number;
  total_page_views?: number;
  top_features?: Array<{ name: string; count: number }>;
}

interface UserManagementProps {
  userRole: string;
}

const UserManagement = ({ userRole }: UserManagementProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("all");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUserRole, setNewUserRole] = useState("");
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [newUserPlan, setNewUserPlan] = useState("starter");
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createdUserInfo, setCreatedUserInfo] = useState<{ email: string; password: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // Get all user profiles with subscription info
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get user roles for admin users
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError && rolesError.code !== 'PGRST116') {
        console.error('Error loading user roles:', rolesError);
      }

      // Get last successful login per user from login_attempts
      const userIds = profiles?.map(p => p.user_id) || [];
      let loginMap: Record<string, { ip: string | null; location: string | null; at: string | null }> = {};

      if (userIds.length > 0) {
        const { data: logins } = await supabase
          .from('login_attempts')
          .select('user_id, ip_address, city, country, created_at')
          .eq('success', true)
          .in('user_id', userIds)
          .order('created_at', { ascending: false })
          .limit(1000);

        if (logins) {
          for (const l of logins) {
            if (l.user_id && !loginMap[l.user_id]) {
              const parts = [l.city, l.country].filter(Boolean);
              loginMap[l.user_id] = {
                ip: l.ip_address,
                location: parts.length > 0 ? parts.join(', ') : null,
                at: l.created_at,
              };
            }
          }
        }
      }

      // Fetch activity summary from the DB function
      let activityMap: Record<string, { last_active_at: string | null; active_days_7d: number; active_days_30d: number; total_page_views: number; top_features: Array<{ name: string; count: number }> }> = {};
      const { data: activityData } = await supabase.rpc('get_user_activity_summary');
      if (activityData) {
        for (const a of activityData as any[]) {
          activityMap[a.user_id] = {
            last_active_at: a.last_active_at,
            active_days_7d: a.active_days_7d || 0,
            active_days_30d: a.active_days_30d || 0,
            total_page_views: Number(a.total_page_views) || 0,
            top_features: a.top_features || [],
          };
        }
      }

      // Combine the data
      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        role: userRoles?.find(role => role.user_id === profile.user_id)?.role,
        last_login_ip: loginMap[profile.user_id]?.ip ?? null,
        last_login_location: loginMap[profile.user_id]?.location ?? null,
        last_sign_in_at: loginMap[profile.user_id]?.at ?? profile.last_sign_in_at ?? null,
        last_active_at: activityMap[profile.user_id]?.last_active_at ?? null,
        active_days_7d: activityMap[profile.user_id]?.active_days_7d ?? 0,
        active_days_30d: activityMap[profile.user_id]?.active_days_30d ?? 0,
        total_page_views: activityMap[profile.user_id]?.total_page_views ?? 0,
        top_features: activityMap[profile.user_id]?.top_features ?? [],
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeMembership = async (userId: string, newPlan: string, reason?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-change-membership', {
        body: {
          user_id: userId,
          new_plan: newPlan,
          reason: reason || `Admin changed plan to ${newPlan}`,
          is_free_assignment: true
        }
      });

      if (error) throw error;

      toast({
        title: "Membership Updated",
        description: `User plan changed to ${newPlan}`,
      });

      loadUsers(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update membership",
        variant: "destructive",
      });
    }
  };

  const handleGrantAdminRole = async (userId: string, role: 'admin' | 'super_admin') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Admin Role Granted",
        description: `User granted ${role} privileges`,
      });

      loadUsers();
      setIsRoleDialogOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to grant admin role",
        variant: "destructive",
      });
    }
  };

  const handleRevokeAdminRole = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Admin Role Revoked",
        description: "User admin privileges removed",
      });

      loadUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke admin role",
        variant: "destructive",
      });
    }
  };

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 12; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    return pass;
  };

  const handleCreateUser = async () => {
    if (!newEmail.trim()) {
      toast({ title: "Error", description: "Email is required", variant: "destructive" });
      return;
    }
    const password = tempPassword.trim() || generateTempPassword();
    setIsCreatingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: { email: newEmail.trim(), temp_password: password, subscription_plan: newUserPlan }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setCreatedUserInfo({ email: newEmail.trim(), password });
      toast({ title: "User Created", description: `Account created for ${newEmail.trim()}` });
      loadUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create user", variant: "destructive" });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const resetCreateUserDialog = () => {
    setIsCreateUserOpen(false);
    setNewEmail("");
    setTempPassword("");
    setNewUserPlan("starter");
    setCreatedUserInfo(null);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = selectedPlan === "all" || user.subscription_plan === selectedPlan;
    return matchesSearch && matchesPlan;
  });

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'starter': return 'bg-gray-100 text-gray-800';
      case 'pro': return 'bg-blue-100 text-blue-800';
      case 'elite': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">PRO</Badge>
              <div>
                <p className="text-sm text-muted-foreground">Pro Members</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.subscription_plan === 'pro').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Badge className="text-xs">ELITE</Badge>
              <div>
                <p className="text-sm text-muted-foreground">Elite Members</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.subscription_plan === 'elite').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.role).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage user accounts, subscriptions, and admin privileges
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="elite">Elite</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setIsCreateUserOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPlanColor(user.subscription_plan)}>
                        {user.subscription_plan?.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.subscription_status === 'active' ? 'default' : 'secondary'}>
                        {user.subscription_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.role ? (
                        <Badge variant="destructive">
                          <Shield className="h-3 w-3 mr-1" />
                          {user.role.replace('_', ' ').toUpperCase()}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">User</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-sm space-y-0.5 cursor-default">
                              {user.last_active_at ? (
                                <>
                                  <p className="font-medium flex items-center gap-1">
                                    <Activity className="h-3 w-3 text-primary" />
                                    {new Date(user.last_active_at).toLocaleDateString()}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {user.active_days_7d}d / 7d · {user.active_days_30d}d / 30d
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {(user.total_page_views ?? 0).toLocaleString()} views
                                  </p>
                                </>
                              ) : (
                                <span className="text-xs text-muted-foreground">No activity</span>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs">
                            <div className="space-y-1">
                              <p className="font-medium text-xs">Top Features</p>
                              {user.top_features && user.top_features.length > 0 ? (
                                user.top_features.map((f, i) => (
                                  <p key={i} className="text-xs">
                                    {f.name.replace(/\./g, ' › ')} — {f.count}×
                                  </p>
                                ))
                              ) : (
                                <p className="text-xs text-muted-foreground">No feature usage</p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {user.last_sign_in_at ? (
                        <div className="text-sm">
                          <p>{new Date(user.last_sign_in_at).toLocaleDateString()}{' '}
                            <span className="text-muted-foreground">
                              {new Date(user.last_sign_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </p>
                          {user.last_login_location && (
                            <p className="text-xs text-muted-foreground">{user.last_login_location}</p>
                          )}
                          {user.last_login_ip && (
                            <p className="text-xs text-muted-foreground font-mono">{user.last_login_ip}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Select onValueChange={(value) => handleChangeMembership(user.user_id, value)}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Change Plan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="starter">Starter</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="elite">Elite</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {userRole === 'super_admin' && (
                          <>
                            {!user.role ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingUser(user);
                                  setIsRoleDialogOpen(true);
                                }}
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRevokeAdminRole(user.user_id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Grant Admin Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Admin Role</DialogTitle>
            <DialogDescription>
              Grant admin privileges to {editingUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Admin Role</Label>
              <Select value={newUserRole} onValueChange={setNewUserRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select admin role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => editingUser && handleGrantAdminRole(editingUser.user_id, newUserRole as 'admin' | 'super_admin')}
              disabled={!newUserRole}
            >
              Grant Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={isCreateUserOpen} onOpenChange={(open) => { if (!open) resetCreateUserDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create an account by email with a temporary password
            </DialogDescription>
          </DialogHeader>

          {!createdUserInfo ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Temporary Password</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Leave blank to auto-generate"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTempPassword(generateTempPassword())}
                  >
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Min 6 characters. Auto-generated if left blank.</p>
              </div>
              <div className="space-y-2">
                <Label>Subscription Plan</Label>
                <Select value={newUserPlan} onValueChange={setNewUserPlan}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="elite">Elite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={resetCreateUserDialog}>Cancel</Button>
                <Button onClick={handleCreateUser} disabled={isCreatingUser || !newEmail.trim()}>
                  {isCreatingUser ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : "Create Account"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <p className="text-sm font-medium text-foreground">Account created successfully! Share these credentials:</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 rounded-md bg-background p-2 border">
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-mono">{createdUserInfo.email}</p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleCopy(createdUserInfo.email, 'email')}>
                      {copiedField === 'email' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-2 rounded-md bg-background p-2 border">
                    <div>
                      <p className="text-xs text-muted-foreground">Temporary Password</p>
                      <p className="text-sm font-mono">{createdUserInfo.password}</p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleCopy(createdUserInfo.password, 'password')}>
                      {copiedField === 'password' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">⚠️ This password is shown only once. Make sure to copy it now.</p>
              </div>
              <DialogFooter>
                <Button onClick={resetCreateUserDialog}>Done</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;