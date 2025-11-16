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

interface StaffFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId?: string | null;
  onSuccess: () => void;
}

export const StaffFormDialog = ({ open, onOpenChange, staffId, onSuccess }: StaffFormDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    bio: "",
    hourly_rate: "",
    specialties: "",
  });

  useEffect(() => {
    if (staffId && open) {
      fetchStaffData();
    } else if (!staffId) {
      resetForm();
    }
  }, [staffId, open]);

  const fetchStaffData = async () => {
    if (!staffId) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", staffId)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load staff data",
        variant: "destructive"
      });
      return;
    }

    setFormData({
      full_name: data.full_name || "",
      email: data.email || "",
      phone: data.phone || "",
      bio: data.bio || "",
      hourly_rate: data.hourly_rate?.toString() || "",
      specialties: data.specialties?.join(", ") || "",
    });
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      bio: "",
      hourly_rate: "",
      specialties: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const specialtiesArray = formData.specialties
        .split(",")
        .map(s => s.trim())
        .filter(s => s);

      if (staffId) {
        // Update existing staff
        const { error } = await supabase
          .from("profiles")
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            bio: formData.bio,
            hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
            specialties: specialtiesArray.length > 0 ? specialtiesArray : null,
          })
          .eq("id", staffId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Staff member updated successfully"
        });
      } else {
        // Create new staff - would require admin signup endpoint
        toast({
          title: "Info",
          description: "New staff creation requires invite system (coming soon)",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving staff:", error);
      toast({
        title: "Error",
        description: "Failed to save staff member",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{staffId ? "Edit Staff Member" : "Add Staff Member"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!!staffId}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
              <Input
                id="hourly_rate"
                type="number"
                step="0.01"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialties">Specialties (comma-separated)</Label>
            <Input
              id="specialties"
              placeholder="Massage, Haircut, Facial"
              value={formData.specialties}
              onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {staffId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
