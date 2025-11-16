import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";

interface HandoffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  clientName: string;
  service: string;
}

export const HandoffDialog = ({ open, onOpenChange, jobId, clientName, service }: HandoffDialogProps) => {
  const [staffEmail, setStaffEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to transfer jobs');
        return;
      }

      // Find the staff member by email
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', staffEmail.trim())
        .single();

      if (profileError || !profiles) {
        toast.error('Staff member not found. Please check the email address.');
        return;
      }

      if (profiles.id === user.id) {
        toast.error('You cannot transfer a job to yourself');
        return;
      }

      // Create handoff notification
      const { error: handoffError } = await supabase
        .from('handoff_notifications')
        .insert({
          from_staff_id: user.id,
          to_staff_id: profiles.id,
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
      setStaffEmail("");
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
          <div className="space-y-2">
            <Label htmlFor="staff-email">Staff Member Email</Label>
            <Input
              id="staff-email"
              type="email"
              placeholder="colleague@example.com"
              value={staffEmail}
              onChange={(e) => setStaffEmail(e.target.value)}
              required
            />
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
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
