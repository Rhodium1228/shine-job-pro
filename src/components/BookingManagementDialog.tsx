import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const bookingSchema = z.object({
  staff_id: z.string().uuid({ message: "Please select a staff member" }),
  client_name: z.string().trim().min(1, { message: "Client name is required" }).max(100),
  service: z.string().trim().min(1, { message: "Service is required" }).max(200),
  booking_time: z.string().min(1, { message: "Date and time are required" }),
  duration: z.string().trim().min(1, { message: "Duration is required" }).max(50),
  price: z.number().positive({ message: "Price must be a positive number" }),
  status: z.enum(["pending", "accepted"]),
  client_phone: z.string().trim().max(50).optional(),
  client_email: z.string().trim().email({ message: "Invalid email" }).max(255).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional(),
  branch_id: z.string().optional(),
});

interface Staff {
  id: string;
  full_name: string | null;
  email: string | null;
}

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
}

interface BookingManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking?: Booking | null;
  onSuccess: () => void;
}

export const BookingManagementDialog = ({
  open,
  onOpenChange,
  booking,
  onSuccess,
}: BookingManagementDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState({
    staff_id: "",
    client_name: "",
    service: "",
    booking_time: "",
    duration: "60 min",
    price: "0",
    status: "pending",
    client_phone: "",
    client_email: "",
    notes: "",
    branch_id: "",
  });

  useEffect(() => {
  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setBranches(data || []);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const fetchStaff = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name");

      if (error) {
        console.error("Error fetching staff:", error);
        return;
      }

      setStaff(data || []);
    };

    fetchStaff();
  }, []);

  useEffect(() => {
    if (booking) {
      setFormData({
        staff_id: booking.staff_id,
        client_name: booking.client_name,
        service: booking.service,
        booking_time: booking.booking_time.slice(0, 16),
        duration: booking.duration,
        price: String(booking.price),
        status: booking.status,
        client_phone: booking.client_phone || "",
        client_email: booking.client_email || "",
        notes: booking.notes || "",
        branch_id: booking.branch_id || "",
      });
    } else {
      setFormData({
        staff_id: "",
        client_name: "",
        service: "",
        booking_time: "",
        duration: "60 min",
        price: "0",
        status: "pending",
        client_phone: "",
        client_email: "",
        notes: "",
        branch_id: "",
      });
    }
  }, [booking, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = bookingSchema.parse({
        ...formData,
        price: parseFloat(formData.price) || 0,
      });

      const bookingData = {
        staff_id: validated.staff_id,
        client_name: validated.client_name,
        service: validated.service,
        booking_time: new Date(validated.booking_time).toISOString(),
        duration: validated.duration,
        price: validated.price,
        status: validated.status,
        client_phone: validated.client_phone || null,
        client_email: validated.client_email || null,
        notes: validated.notes || null,
        salon_id: validated.branch_id || null,
      };

      if (booking) {
        const { error } = await supabase
          .from("bookings")
          .update(bookingData)
          .eq("id", booking.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Booking updated successfully",
        });
      } else {
        const { error } = await supabase.from("bookings").insert(bookingData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Booking created successfully",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        console.error("Error saving booking:", error);
        toast({
          title: "Error",
          description: "Failed to save booking",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{booking ? "Edit Booking" : "Create New Booking"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="staff_id">Staff Member *</Label>
            <Select
              value={formData.staff_id}
              onValueChange={(value) => setFormData({ ...formData, staff_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name || member.email || "Unknown"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="branch_id">Branch (Optional)</Label>
            <Select
              value={formData.branch_id}
              onValueChange={(value) => setFormData({ ...formData, branch_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select branch (optional)" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_name">Client Name *</Label>
              <Input
                id="client_name"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                required
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service">Service *</Label>
              <Input
                id="service"
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                required
                maxLength={200}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="booking_time">Date & Time *</Label>
              <Input
                id="booking_time"
                type="datetime-local"
                value={formData.booking_time}
                onChange={(e) => setFormData({ ...formData, booking_time: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration *</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="e.g., 60 min"
                required
                maxLength={50}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="e.g., $120"
                required
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_phone">Client Phone</Label>
              <Input
                id="client_phone"
                value={formData.client_phone}
                onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_email">Client Email</Label>
              <Input
                id="client_email"
                type="email"
                value={formData.client_email}
                onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                maxLength={255}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              maxLength={1000}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : booking ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
