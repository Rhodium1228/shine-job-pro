import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Calendar as CalendarIcon,
  User,
  Building2,
  Download,
  X,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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
import { BookingManagementDialog } from "@/components/BookingManagementDialog";
import { ManualBookingDialog } from "@/components/ManualBookingDialog";
import { CustomerHistoryDialog } from "@/components/CustomerHistoryDialog";
import { cn } from "@/lib/utils";

interface Booking {
  id: string;
  staff_id: string;
  client_name: string;
  service: string;
  booking_time: string;
  duration: string;
  price: number;
  status: string;
  client_phone?: string | null;
  client_email?: string | null;
  notes?: string | null;
  branch_id?: string | null;
  profiles: {
    full_name: string | null;
  } | null;
  branches: {
    name: string;
  } | null;
}

const EnhancedBookingManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set());
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBranch, setFilterBranch] = useState<string>("all");
  const [filterStaff, setFilterStaff] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterService, setFilterService] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [manualBookingOpen, setManualBookingOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{
    name: string;
    phone?: string | null;
    email?: string | null;
  } | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bulkCancelDialogOpen, setBulkCancelDialogOpen] = useState(false);
  
  // Filter options
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [staff, setStaff] = useState<{ id: string; full_name: string | null }[]>([]);
  const [services, setServices] = useState<string[]>([]);

  useEffect(() => {
    fetchBookings();
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bookings, searchQuery, filterBranch, filterStaff, filterStatus, filterService, dateRange]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          profiles:staff_id (full_name),
          branches:branch_id (name)
        `)
        .order("booking_time", { ascending: false });

      if (error) throw error;
      setBookings(data as any);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const [branchRes, staffRes, servicesRes] = await Promise.all([
        supabase.from("branches").select("id, name").eq("is_active", true),
        supabase.from("profiles").select("id, full_name"),
        supabase.from("bookings").select("service").limit(1000)
      ]);

      if (branchRes.data) setBranches(branchRes.data);
      if (staffRes.data) setStaff(staffRes.data);
      if (servicesRes.data) {
        const uniqueServices = [...new Set(servicesRes.data.map(b => b.service))];
        setServices(uniqueServices);
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        b =>
          b.client_name.toLowerCase().includes(query) ||
          b.service.toLowerCase().includes(query) ||
          b.client_phone?.toLowerCase().includes(query) ||
          b.client_email?.toLowerCase().includes(query)
      );
    }

    // Branch filter
    if (filterBranch !== "all") {
      filtered = filtered.filter(b => b.branch_id === filterBranch);
    }

    // Staff filter
    if (filterStaff !== "all") {
      filtered = filtered.filter(b => b.staff_id === filterStaff);
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(b => b.status === filterStatus);
    }

    // Service filter
    if (filterService !== "all") {
      filtered = filtered.filter(b => b.service === filterService);
    }

    // Date range filter
    if (dateRange.from) {
      filtered = filtered.filter(b => {
        const bookingDate = new Date(b.booking_time);
        return bookingDate >= dateRange.from!;
      });
    }
    if (dateRange.to) {
      filtered = filtered.filter(b => {
        const bookingDate = new Date(b.booking_time);
        return bookingDate <= dateRange.to!;
      });
    }

    setFilteredBookings(filtered);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBookings(new Set(filteredBookings.map(b => b.id)));
    } else {
      setSelectedBookings(new Set());
    }
  };

  const handleSelectBooking = (bookingId: string, checked: boolean) => {
    const newSelected = new Set(selectedBookings);
    if (checked) {
      newSelected.add(bookingId);
    } else {
      newSelected.delete(bookingId);
    }
    setSelectedBookings(newSelected);
  };

  const handleBulkCancel = async () => {
    try {
      const ids = Array.from(selectedBookings);
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .in("id", ids);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${ids.length} booking(s) cancelled`
      });

      setSelectedBookings(new Set());
      fetchBookings();
      setBulkCancelDialogOpen(false);
    } catch (error) {
      console.error("Error cancelling bookings:", error);
      toast({
        title: "Error",
        description: "Failed to cancel bookings",
        variant: "destructive"
      });
    }
  };

  const handleExport = () => {
    // Create CSV
    const headers = ["Date", "Client", "Service", "Staff", "Branch", "Status", "Price"];
    const rows = filteredBookings.map(b => [
      format(new Date(b.booking_time), "yyyy-MM-dd HH:mm"),
      b.client_name,
      b.service,
      (b.profiles as any)?.full_name || "Unknown",
      (b.branches as any)?.name || "N/A",
      b.status,
      b.price
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterBranch("all");
    setFilterStaff("all");
    setFilterStatus("all");
    setFilterService("all");
    setDateRange({});
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-600 dark:text-green-400";
      case "confirmed":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "cancelled":
        return "bg-red-500/10 text-red-600 dark:text-red-400";
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
      default:
        return "bg-gray-500/10 text-gray-600 dark:text-gray-400";
    }
  };

  const hasActiveFilters = searchQuery || filterBranch !== "all" || filterStaff !== "all" || 
    filterStatus !== "all" || filterService !== "all" || dateRange.from || dateRange.to;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Booking Management</h1>
                <p className="text-sm text-muted-foreground">
                  {filteredBookings.length} of {bookings.length} bookings
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button onClick={() => setManualBookingOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Walk-in
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Filters */}
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Filters</h3>
                {hasActiveFilters && (
                  <Badge variant="secondary">{
                    [searchQuery, filterBranch !== "all", filterStaff !== "all", 
                     filterStatus !== "all", filterService !== "all", 
                     dateRange.from, dateRange.to].filter(Boolean).length
                  }</Badge>
                )}
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Branch Filter */}
              <Select value={filterBranch} onValueChange={setFilterBranch}>
                <SelectTrigger>
                  <Building2 className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Staff Filter */}
              <Select value={filterStaff} onValueChange={setFilterStaff}>
                <SelectTrigger>
                  <User className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="All Staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {staff.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name || "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {/* Service Filter */}
              <Select value={filterService} onValueChange={setFilterService}>
                <SelectTrigger>
                  <SelectValue placeholder="All Services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {services.map(service => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date Range */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn(!dateRange.from && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
                        </>
                      ) : (
                        format(dateRange.from, "MMM dd, yyyy")
                      )
                    ) : (
                      "Date Range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </Card>

        {/* Bulk Actions */}
        {selectedBookings.size > 0 && (
          <Card className="p-4 bg-primary/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={selectedBookings.size === filteredBookings.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="font-medium">
                  {selectedBookings.size} selected
                </span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkCancelDialogOpen(true)}
              >
                Cancel Selected
              </Button>
            </div>
          </Card>
        )}

        {/* Bookings List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No bookings found</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="p-4">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={selectedBookings.has(booking.id)}
                    onCheckedChange={(checked) => handleSelectBooking(booking.id, checked as boolean)}
                  />
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <p className="font-semibold">{booking.client_name}</p>
                      <p className="text-sm text-muted-foreground">{booking.service}</p>
                    </div>
                    
                    <div className="text-sm">
                      <p className="text-muted-foreground">Date & Time</p>
                      <p className="font-medium">{format(new Date(booking.booking_time), "PPp")}</p>
                    </div>
                    
                    <div className="text-sm">
                      <p className="text-muted-foreground">Staff</p>
                      <p className="font-medium">{(booking.profiles as any)?.full_name || "Unknown"}</p>
                    </div>
                    
                    <div className="text-sm">
                      <p className="text-muted-foreground">Branch</p>
                      <p className="font-medium">{(booking.branches as any)?.name || "N/A"}</p>
                    </div>
                    
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                        <p className="text-sm font-semibold mt-1">{booking.price}</p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCustomer({
                            name: booking.client_name,
                            phone: booking.client_phone,
                            email: booking.client_email
                          });
                          setHistoryDialogOpen(true);
                        }}
                      >
                        <History className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <BookingManagementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        booking={selectedBooking}
        onSuccess={fetchBookings}
      />

      <ManualBookingDialog
        open={manualBookingOpen}
        onOpenChange={setManualBookingOpen}
        onSuccess={fetchBookings}
      />

      {selectedCustomer && (
        <CustomerHistoryDialog
          open={historyDialogOpen}
          onOpenChange={setHistoryDialogOpen}
          customerName={selectedCustomer.name}
          customerPhone={selectedCustomer.phone}
          customerEmail={selectedCustomer.email}
        />
      )}

      <AlertDialog open={bulkCancelDialogOpen} onOpenChange={setBulkCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel {selectedBookings.size} Booking(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark all selected bookings as cancelled. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkCancel}>
              Confirm Cancellation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EnhancedBookingManagement;
