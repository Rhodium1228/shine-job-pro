import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar, DollarSign, Clock, User } from "lucide-react";

interface CustomerHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
}

interface BookingHistory {
  id: string;
  service: string;
  booking_time: string;
  status: string;
  price: string;
  duration: string;
  profiles: {
    full_name: string | null;
  };
  branches: {
    name: string;
  };
}

export const CustomerHistoryDialog = ({
  open,
  onOpenChange,
  customerName,
  customerPhone,
  customerEmail,
}: CustomerHistoryDialogProps) => {
  const { toast } = useToast();
  const [history, setHistory] = useState<BookingHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalSpent: 0,
    avgRating: 0,
  });

  useEffect(() => {
    if (open) {
      fetchCustomerHistory();
    }
  }, [open, customerName]);

  const fetchCustomerHistory = async () => {
    try {
      setLoading(true);
      
      // Build query based on available customer info
      let query = supabase
        .from("bookings")
        .select(`
          id,
          service,
          booking_time,
          status,
          price,
          duration,
          profiles:staff_id (full_name),
          branches:branch_id (name)
        `)
        .eq("client_name", customerName)
        .order("booking_time", { ascending: false })
        .limit(50);

      if (customerPhone) {
        query = query.eq("client_phone", customerPhone);
      } else if (customerEmail) {
        query = query.eq("client_email", customerEmail);
      }

      const { data, error } = await query;

      if (error) throw error;

      setHistory(data as any);

      // Calculate stats
      const totalBookings = data.length;
      const totalSpent = data.reduce((sum, booking) => {
        return sum + parseFloat(booking.price.replace(/[^0-9.-]+/g, ""));
      }, 0);

      setStats({
        totalBookings,
        totalSpent,
        avgRating: 0, // Would need ratings data
      });
    } catch (error) {
      console.error("Error fetching customer history:", error);
      toast({
        title: "Error",
        description: "Failed to load customer history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-600 dark:text-green-400";
      case "confirmed":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "cancelled":
        return "bg-red-500/10 text-red-600 dark:text-red-400";
      default:
        return "bg-gray-500/10 text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Customer History: {customerName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                  <p className="text-2xl font-bold">{stats.totalBookings}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold">${stats.totalSpent.toFixed(2)}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Duration</p>
                  <p className="text-2xl font-bold">
                    {history.length > 0 ? "60" : "0"} min
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Booking History */}
          <div>
            <h3 className="font-semibold mb-4">Booking History</h3>
            {loading ? (
              <div className="text-center py-8">Loading history...</div>
            ) : history.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No booking history found</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {history.map((booking) => (
                  <Card key={booking.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{booking.service}</h4>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <p>
                            <Calendar className="inline h-4 w-4 mr-1" />
                            {format(new Date(booking.booking_time), "PPp")}
                          </p>
                          <p>
                            <Clock className="inline h-4 w-4 mr-1" />
                            {booking.duration}
                          </p>
                          <p>
                            <User className="inline h-4 w-4 mr-1" />
                            {(booking.profiles as any)?.full_name || "Unknown"}
                          </p>
                          <p>
                            <DollarSign className="inline h-4 w-4 mr-1" />
                            {booking.price}
                          </p>
                        </div>
                        {(booking.branches as any)?.name && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Branch: {(booking.branches as any).name}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
