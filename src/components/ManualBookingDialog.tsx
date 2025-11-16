import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ManualBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Staff {
  id: string;
  full_name: string | null;
}

interface Branch {
  id: string;
  name: string;
}

export const ManualBookingDialog = ({ open, onOpenChange, onSuccess }: ManualBookingDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [formData, setFormData] = useState({
    client_name: "",
    client_phone: "",
    client_email: "",
    service: "",
    staff_id: "",
    branch_id: "",
    booking_time: "",
    duration: "60 minutes",
    price: "",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      fetchStaffAndBranches();
      // Set default booking time to now
      const now = new Date();
      now.setMinutes(Math.round(now.getMinutes() / 15) * 15);
      setFormData(prev => ({
        ...prev,
        booking_time: now.toISOString().slice(0, 16)
      }));
    }
  }, [open]);

  const fetchStaffAndBranches = async () => {
    try {
      const [staffRes, branchRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name").order("full_name"),
        supabase.from("branches").select("id, name").eq("is_active", true).order("name")
      ]);

      if (staffRes.data) setStaff(staffRes.data);
      if (branchRes.data) setBranches(branchRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("bookings").insert({
        client_name: formData.client_name,
        client_phone: formData.client_phone || null,
        client_email: formData.client_email || null,
        service: formData.service,
        staff_id: formData.staff_id,
        branch_id: formData.branch_id || null,
        booking_time: new Date(formData.booking_time).toISOString(),
        duration: formData.duration,
        price: formData.price,
        notes: formData.notes || null,
        status: "confirmed",
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Walk-in booking created successfully"
      });

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error creating booking:", error);
      toast({
        title: "Error",
        description: "Failed to create booking",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      client_name: "",
      client_phone: "",
      client_email: "",
      service: "",
      staff_id: "",
      branch_id: "",
      booking_time: "",
      duration: "60 minutes",
      price: "",
      notes: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Walk-in Booking</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_name">Client Name *</Label>
              <Input
                id="client_name"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_phone">Phone</Label>
              <Input
                id="client_phone"
                type="tel"
                value={formData.client_phone}
                onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_email">Email</Label>
              <Input
                id="client_email"
                type="email"
                value={formData.client_email}
                onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service">Service *</Label>
              <Input
                id="service"
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff_id">Staff Member *</Label>
              <Select
                value={formData.staff_id}
                onValueChange={(value) => setFormData({ ...formData, staff_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff..." />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name || "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch_id">Branch</Label>
              <Select
                value={formData.branch_id}
                onValueChange={(value) => setFormData({ ...formData, branch_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select branch..." />
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
              <Label htmlFor="duration">Duration</Label>
              <Select
                value={formData.duration}
                onValueChange={(value) => setFormData({ ...formData, duration: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30 minutes">30 minutes</SelectItem>
                  <SelectItem value="45 minutes">45 minutes</SelectItem>
                  <SelectItem value="60 minutes">60 minutes</SelectItem>
                  <SelectItem value="90 minutes">90 minutes</SelectItem>
                  <SelectItem value="120 minutes">120 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price ($) *</Label>
              <Input
                id="price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="85.00"
                required
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
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Booking
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
