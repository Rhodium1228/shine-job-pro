import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight, Loader2, User, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HandoffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  clientName: string;
  service: string;
}

interface StaffMember {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export const HandoffDialog = ({ open, onOpenChange, jobId, clientName, service }: HandoffDialogProps) => {
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);

  useEffect(() => {
    if (open) {
      loadStaffMembers();
    }
  }, [open]);

  const loadStaffMembers = async () => {
    setLoadingStaff(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .neq('id', user.id)
      .order('full_name');

    if (error) {
      console.error('Error loading staff:', error);
      toast.error('Failed to load staff directory');
    } else {
      setStaffMembers(data || []);
    }
    setLoadingStaff(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStaffId) {
      toast.error('Please select a staff member');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to transfer jobs');
        return;
      }

      // Create handoff notification
      const { error: handoffError } = await supabase
        .from('handoff_notifications')
        .insert({
          from_staff_id: user.id,
          to_staff_id: selectedStaffId,
          job_id: jobId,
          client_name: clientName,
          service: service,
          message: message.trim() || null,
          status: 'pending',
        });

      if (handoffError) {
        console.error('Error creating handoff:', handoffError);
        toast.error('Failed to create handoff request');
        return;
      }

      toast.success('Handoff request sent!');
      onOpenChange(false);
      setSelectedStaffId("");
      setMessage("");
    } catch (error) {
      console.error('Error in handoff:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-primary" />
            Transfer Job
          </DialogTitle>
          <DialogDescription>
            Transfer "{clientName}" to another staff member
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label>Select Staff Member</Label>
            {loadingStaff ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : staffMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No other staff members found</p>
              </div>
            ) : (
              <ScrollArea className="h-[200px] pr-4">
                <RadioGroup value={selectedStaffId} onValueChange={setSelectedStaffId}>
                  <div className="space-y-2">
                    {staffMembers.map((staff) => (
                      <label
                        key={staff.id}
                        htmlFor={staff.id}
                        className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
                      >
                        <RadioGroupItem value={staff.id} id={staff.id} />
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={staff.avatar_url || undefined} />
                          <AvatarFallback>
                            {staff.full_name?.charAt(0) || staff.email?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {staff.full_name || 'Unnamed Staff'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {staff.email}
                          </p>
                        </div>
                        {selectedStaffId === staff.id && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </ScrollArea>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add any notes about this client or job..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedStaffId || loadingStaff}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
