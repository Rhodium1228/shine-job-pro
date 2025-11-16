import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  UserPlus,
  Search,
  MoreVertical,
  Clock,
  Calendar,
  Ban,
  CheckCircle,
  Edit,
  FileText,
  ClipboardCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { StaffFormDialog } from "@/components/StaffFormDialog";
import { BreakRequestsPanel } from "@/components/BreakRequestsPanel";
import { StaffServicesDialog } from "@/components/StaffServicesDialog";

interface StaffMember {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  hourly_rate: number | null;
  rating: number | null;
  specialties: string[] | null;
  availability_status: string | null;
  is_suspended: boolean | null;
}

interface ShiftHistory {
  id: string;
  staff_id: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
}

const StaffManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");
  const [shiftHistory, setShiftHistory] = useState<ShiftHistory[]>([]);
  const [selectedStaffForHistory, setSelectedStaffForHistory] = useState<string | null>(null);
  const [servicesDialogOpen, setServicesDialogOpen] = useState(false);
  const [selectedStaffForServices, setSelectedStaffForServices] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    filterStaff();
  }, [searchQuery, staff, selectedTab]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name");

      if (error) throw error;
      setStaff(data as StaffMember[]);
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast({
        title: "Error",
        description: "Failed to load staff members",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterStaff = () => {
    let filtered = staff;

    // Filter by tab
    if (selectedTab === "active") {
      filtered = filtered.filter(s => !s.is_suspended);
    } else if (selectedTab === "suspended") {
      filtered = filtered.filter(s => s.is_suspended);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        s =>
          s.full_name?.toLowerCase().includes(query) ||
          s.email?.toLowerCase().includes(query) ||
          s.specialties?.some(spec => spec.toLowerCase().includes(query))
      );
    }

    setFilteredStaff(filtered);
  };

  const handleSuspendToggle = async () => {
    if (!selectedStaffId) return;

    try {
      const staffMember = staff.find(s => s.id === selectedStaffId);
      if (!staffMember) return;

      const newSuspendedStatus = !staffMember.is_suspended;

      const { error } = await supabase
        .from("profiles")
        .update({ is_suspended: newSuspendedStatus })
        .eq("id", selectedStaffId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Staff member ${newSuspendedStatus ? "suspended" : "activated"} successfully`
      });

      fetchStaff();
      setSuspendDialogOpen(false);
      setSelectedStaffId(null);
    } catch (error) {
      console.error("Error toggling suspension:", error);
      toast({
        title: "Error",
        description: "Failed to update staff status",
        variant: "destructive"
      });
    }
  };

  const fetchShiftHistory = async (staffId: string) => {
    try {
      const { data, error } = await supabase
        .from("status_history")
        .select("*")
        .eq("staff_id", staffId)
        .order("started_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setShiftHistory(data as ShiftHistory[]);
      setSelectedStaffForHistory(staffId);
    } catch (error) {
      console.error("Error fetching shift history:", error);
      toast({
        title: "Error",
        description: "Failed to load shift history",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">Available</Badge>;
      case "busy":
        return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400">Busy</Badge>;
      case "on_break":
        return <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">On Break</Badge>;
      case "offline":
        return <Badge variant="outline">Offline</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/admin")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Staff Management</h1>
                <p className="text-sm text-muted-foreground">
                  Manage staff members, schedules, and permissions
                </p>
              </div>
            </div>
            <Button onClick={() => { setSelectedStaffId(null); setFormDialogOpen(true); }}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Staff
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="all">All Staff</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="suspended">Suspended</TabsTrigger>
            <TabsTrigger value="break-requests">Break Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <StaffListContent
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              loading={loading}
              filteredStaff={filteredStaff}
              getStatusBadge={getStatusBadge}
              setSelectedStaffId={setSelectedStaffId}
              setFormDialogOpen={setFormDialogOpen}
              setSuspendDialogOpen={setSuspendDialogOpen}
              fetchShiftHistory={fetchShiftHistory}
              setServicesDialogOpen={setServicesDialogOpen}
              setSelectedStaffForServices={setSelectedStaffForServices}
            />
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            <StaffListContent
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              loading={loading}
              filteredStaff={filteredStaff}
              getStatusBadge={getStatusBadge}
              setSelectedStaffId={setSelectedStaffId}
              setFormDialogOpen={setFormDialogOpen}
              setSuspendDialogOpen={setSuspendDialogOpen}
              fetchShiftHistory={fetchShiftHistory}
              setServicesDialogOpen={setServicesDialogOpen}
              setSelectedStaffForServices={setSelectedStaffForServices}
            />
          </TabsContent>

          <TabsContent value="suspended" className="space-y-4">
            <StaffListContent
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              loading={loading}
              filteredStaff={filteredStaff}
              getStatusBadge={getStatusBadge}
              setSelectedStaffId={setSelectedStaffId}
              setFormDialogOpen={setFormDialogOpen}
              setSuspendDialogOpen={setSuspendDialogOpen}
              fetchShiftHistory={fetchShiftHistory}
              setServicesDialogOpen={setServicesDialogOpen}
              setSelectedStaffForServices={setSelectedStaffForServices}
            />
          </TabsContent>

          <TabsContent value="break-requests">
            <BreakRequestsPanel />
          </TabsContent>
        </Tabs>

        {/* Shift History Dialog */}
        {selectedStaffForHistory && (
          <Card className="mt-6 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Shift History
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedStaffForHistory(null)}
              >
                Close
              </Button>
            </div>
            <div className="space-y-2">
              {shiftHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No shift history available</p>
              ) : (
                shiftHistory.map((shift) => (
                  <div
                    key={shift.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium capitalize">{shift.status}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(shift.started_at), "PPp")}
                        {shift.ended_at && ` - ${format(new Date(shift.ended_at), "PPp")}`}
                      </p>
                    </div>
                    {shift.duration_seconds && (
                      <Badge variant="outline">
                        {Math.round(shift.duration_seconds / 60)} min
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      <StaffFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        staffId={selectedStaffId}
        onSuccess={fetchStaff}
      />

      {selectedStaffForServices && (
        <StaffServicesDialog
          open={servicesDialogOpen}
          onOpenChange={setServicesDialogOpen}
          staffId={selectedStaffForServices.id}
          staffName={selectedStaffForServices.name}
        />
      )}

      <AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {staff.find(s => s.id === selectedStaffId)?.is_suspended
                ? "Activate Staff Member"
                : "Suspend Staff Member"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {staff.find(s => s.id === selectedStaffId)?.is_suspended
                ? "This will reactivate the staff member and restore their access."
                : "This will prevent the staff member from logging in and accepting new bookings."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSuspendToggle}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Extracted component for staff list content
const StaffListContent = ({
  searchQuery,
  setSearchQuery,
  loading,
  filteredStaff,
  getStatusBadge,
  setSelectedStaffId,
  setFormDialogOpen,
  setSuspendDialogOpen,
  fetchShiftHistory,
  setServicesDialogOpen,
  setSelectedStaffForServices,
}: any) => (
  <>
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search by name, email, or specialty..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10"
      />
    </div>

    {loading ? (
      <div className="text-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
      </div>
    ) : filteredStaff.length === 0 ? (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">No staff members found</p>
      </Card>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map((member: StaffMember) => (
          <Card key={member.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary">
                    {member.full_name?.charAt(0) || "?"}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold">{member.full_name || "Unknown"}</h3>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedStaffId(member.id);
                          setFormDialogOpen(true);
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedStaffForServices({
                            id: member.id,
                            name: member.full_name || "Unknown"
                          });
                          setServicesDialogOpen(true);
                        }}
                      >
                        <ClipboardCheck className="mr-2 h-4 w-4" />
                        Manage Services & Pricing
                      </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => fetchShiftHistory(member.id)}>
                    <Clock className="mr-2 h-4 w-4" />
                    View Shift History
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedStaffId(member.id);
                      setSuspendDialogOpen(true);
                    }}
                    className={member.is_suspended ? "text-green-600" : "text-red-600"}
                  >
                    {member.is_suspended ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Activate
                      </>
                    ) : (
                      <>
                        <Ban className="mr-2 h-4 w-4" />
                        Suspend
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                {getStatusBadge(member.availability_status)}
              </div>

              {member.is_suspended && (
                <Badge variant="destructive" className="w-full justify-center">
                  Suspended
                </Badge>
              )}

              {member.hourly_rate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Hourly Rate</span>
                  <span className="font-semibold">${member.hourly_rate}/hr</span>
                </div>
              )}

              {member.specialties && member.specialties.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground mb-2 block">Specialties</span>
                  <div className="flex flex-wrap gap-1">
                    {member.specialties.map((spec, idx) => (
                      <Badge key={idx} variant="outline">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    )}
  </>
);

export default StaffManagement;
