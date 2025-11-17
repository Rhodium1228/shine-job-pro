import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/contexts/BranchContext";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserPlus, Mail, Clock, CheckCircle, XCircle, Users, Shield } from "lucide-react";
import { format } from "date-fns";

export default function StaffInvite() {
  const { selectedBranch } = useBranch();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("invitations");

  // Fetch invitations
  const { data: invitations = [], isLoading: loadingInvitations } = useQuery({
    queryKey: ['staff-invitations', selectedBranch?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_invitations')
        .select(`
          *,
          inviter:profiles!staff_invitations_invited_by_fkey(full_name),
          salon:salons(name)
        `)
        .eq('salon_id', selectedBranch?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBranch?.id,
  });

  // Fetch onboarding requests
  const { data: onboardingRequests = [], isLoading: loadingOnboarding } = useQuery({
    queryKey: ['onboarding-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_onboarding')
        .select(`
          *,
          profile:profiles!staff_onboarding_user_id_fkey(full_name, email, avatar_url),
          invitation:staff_invitations(salon_id, assigned_role)
        `)
        .in('onboarding_status', ['pending_approval'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Send invitation mutation
  const sendInvitationMutation = useMutation({
    mutationFn: async ({ email, assignedRole }: { email: string; assignedRole: string }) => {
      const { data, error } = await supabase.functions.invoke('send-staff-invitation', {
        body: {
          email,
          branchId: selectedBranch?.id,
          assignedRole,
          branchName: selectedBranch?.name,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-invitations'] });
      toast.success('Invitation sent successfully');
    },
    onError: (error: any) => {
      console.error('Invitation error:', error);
      toast.error('Failed to send invitation');
    },
  });

  // Approve/Reject onboarding mutation
  const updateOnboardingMutation = useMutation({
    mutationFn: async ({ 
      onboardingId, 
      status, 
      userId, 
      assignedRole 
    }: { 
      onboardingId: string; 
      status: 'approved' | 'rejected'; 
      userId: string;
      assignedRole?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update onboarding status
      const { error: onboardingError } = await supabase
        .from('staff_onboarding')
        .update({
          onboarding_status: status,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', onboardingId);

      if (onboardingError) throw onboardingError;

      // If approved, create user role (only for admin role)
      if (status === 'approved' && assignedRole === 'admin') {
        // Check if role already exists
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle();

        if (!existingRole) {
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: userId,
              role: 'admin' as const,
            });

          if (roleError) {
            console.error('Role creation error:', roleError);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-requests'] });
      toast.success('Onboarding request processed');
    },
    onError: () => toast.error('Failed to process request'),
  });

  if (!selectedBranch) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Please select a branch to manage staff invitations</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staff Invitations & Onboarding</h1>
          <p className="text-muted-foreground">Invite and approve new staff members for {selectedBranch.name}</p>
        </div>
        <InviteStaffDialog
          branchId={selectedBranch.id}
          onInvite={sendInvitationMutation.mutate}
          isLoading={sendInvitationMutation.isPending}
        />
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Invites</p>
              <p className="text-2xl font-bold">
                {invitations.filter(i => i.status === 'pending').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Awaiting Approval</p>
              <p className="text-2xl font-bold">{onboardingRequests.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Accepted</p>
              <p className="text-2xl font-bold">
                {invitations.filter(i => i.status === 'accepted').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expired/Rejected</p>
              <p className="text-2xl font-bold">
                {invitations.filter(i => ['expired', 'rejected'].includes(i.status)).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="onboarding">
            Onboarding Approvals
            {onboardingRequests.length > 0 && (
              <Badge className="ml-2" variant="destructive">{onboardingRequests.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invitations" className="space-y-4">
          <Card className="p-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Invited By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">{invitation.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{invitation.assigned_role}</Badge>
                      </TableCell>
                      <TableCell>{invitation.inviter?.full_name || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            invitation.status === 'accepted'
                              ? 'default'
                              : invitation.status === 'pending'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {invitation.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(invitation.created_at), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        {new Date(invitation.expires_at) < new Date() ? (
                          <span className="text-red-600">Expired</span>
                        ) : (
                          format(new Date(invitation.expires_at), 'MMM dd, yyyy')
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {invitations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No invitations sent yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-4">
          {onboardingRequests.map((request) => (
            <Card key={request.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{request.profile?.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{request.profile?.email}</p>
                    </div>
                    <Badge variant="outline">{request.invitation?.assigned_role}</Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {request.emergency_contact_name && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Emergency Contact</p>
                        <p className="text-sm">{request.emergency_contact_name}</p>
                        <p className="text-sm text-muted-foreground">{request.emergency_contact_phone}</p>
                      </div>
                    )}
                    {request.certifications && Array.isArray(request.certifications) && request.certifications.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Certifications</p>
                        <p className="text-sm">{request.certifications.length} certificate(s)</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Submitted</p>
                      <p className="text-sm">{format(new Date(request.created_at), 'MMM dd, yyyy HH:mm')}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      updateOnboardingMutation.mutate({
                        onboardingId: request.id,
                        status: 'approved',
                        userId: request.user_id,
                        assignedRole: request.invitation?.assigned_role,
                      })
                    }
                    disabled={updateOnboardingMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateOnboardingMutation.mutate({
                        onboardingId: request.id,
                        status: 'rejected',
                        userId: request.user_id,
                      })
                    }
                    disabled={updateOnboardingMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {onboardingRequests.length === 0 && (
            <Card className="p-8">
              <p className="text-center text-muted-foreground">No pending onboarding requests</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Invite Staff Dialog
function InviteStaffDialog({ branchId, onInvite, isLoading }: any) {
  const [email, setEmail] = useState('');
  const [assignedRole, setAssignedRole] = useState('staff');
  const [open, setOpen] = useState(false);

  const handleSubmit = () => {
    if (!email || !assignedRole) {
      toast.error('Please fill in all fields');
      return;
    }

    onInvite({ email, assignedRole });
    setEmail('');
    setAssignedRole('staff');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Staff Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite New Staff Member</DialogTitle>
          <DialogDescription>
            Send an invitation email to a new staff member
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@example.com"
            />
          </div>
          <div>
            <Label htmlFor="role">Assign Role</Label>
            <Select value={assignedRole} onValueChange={setAssignedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff Member</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Invitation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}