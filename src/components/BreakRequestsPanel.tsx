import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Clock, Check, X, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface BreakRequest {
  id: string;
  staff_id: string;
  requested_at: string;
  break_duration_minutes: number;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  profiles: {
    full_name: string | null;
    email: string | null;
  };
}

export const BreakRequestsPanel = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<BreakRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<BreakRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("break_requests")
        .select(`
          *,
          profiles!break_requests_staff_id_fkey (full_name, email)
        `)
        .order("requested_at", { ascending: false });

      if (error) throw error;
      setRequests(data as any);
    } catch (error) {
      console.error("Error fetching break requests:", error);
      toast({
        title: "Error",
        description: "Failed to load break requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = (request: BreakRequest, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewNotes("");
    setDialogOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!selectedRequest) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("break_requests")
        .update({
          status: reviewAction === "approve" ? "approved" : "rejected",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null,
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Break request ${reviewAction === "approve" ? "approved" : "rejected"}`
      });

      fetchRequests();
      setDialogOpen(false);
    } catch (error) {
      console.error("Error reviewing request:", error);
      toast({
        title: "Error",
        description: "Failed to review break request",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading break requests...</div>;
  }

  return (
    <>
      <div className="space-y-4">
        {requests.length === 0 ? (
          <Card className="p-8 text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No break requests</p>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{request.profiles.full_name || "Unknown"}</h4>
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      <Clock className="inline h-4 w-4 mr-1" />
                      {request.break_duration_minutes} minutes
                    </p>
                    <p>Requested: {format(new Date(request.requested_at), "PPp")}</p>
                    {request.reason && (
                      <p className="mt-2">
                        <MessageSquare className="inline h-4 w-4 mr-1" />
                        {request.reason}
                      </p>
                    )}
                    {request.review_notes && (
                      <p className="mt-2 p-2 bg-muted rounded">
                        <strong>Review notes:</strong> {request.review_notes}
                      </p>
                    )}
                  </div>
                </div>

                {request.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 hover:text-green-700"
                      onClick={() => handleReviewClick(request, "approve")}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleReviewClick(request, "reject")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "Approve" : "Reject"} Break Request
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Staff:</strong> {selectedRequest?.profiles.full_name}
              </p>
              <p className="text-sm">
                <strong>Duration:</strong> {selectedRequest?.break_duration_minutes} minutes
              </p>
              {selectedRequest?.reason && (
                <p className="text-sm">
                  <strong>Reason:</strong> {selectedRequest.reason}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Review Notes (optional)</label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add any notes about this decision..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReviewSubmit}
              variant={reviewAction === "approve" ? "default" : "destructive"}
            >
              {reviewAction === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
