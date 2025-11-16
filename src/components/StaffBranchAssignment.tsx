import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, Star } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Branch {
  id: string;
  name: string;
}

interface StaffMember {
  id: string;
  full_name: string;
  email: string;
  assigned_branches: string[];
  default_branch_id: string | null;
}

interface StaffBranchAssignmentProps {
  branches: Branch[];
  onUpdate: () => void;
}

export const StaffBranchAssignment = ({ branches, onUpdate }: StaffBranchAssignmentProps) => {
  const { toast } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [defaultBranch, setDefaultBranch] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, default_branch_id");

      if (profilesError) throw profilesError;

      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("staff_branches")
        .select("staff_id, branch_id");

      if (assignmentsError) throw assignmentsError;

      const staffWithBranches = (profilesData || []).map((profile) => ({
        ...profile,
        assigned_branches: assignmentsData
          ?.filter((a) => a.staff_id === profile.id)
          .map((a) => a.branch_id) || [],
      }));

      setStaff(staffWithBranches);
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast({
        title: "Error",
        description: "Failed to load staff members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditStaff = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    setSelectedBranches(staffMember.assigned_branches);
    setDefaultBranch(staffMember.default_branch_id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedStaff) return;

    setSaving(true);
    try {
      // Delete existing assignments
      const { error: deleteError } = await supabase
        .from("staff_branches")
        .delete()
        .eq("staff_id", selectedStaff.id);

      if (deleteError) throw deleteError;

      // Insert new assignments
      if (selectedBranches.length > 0) {
        const assignments = selectedBranches.map((branchId) => ({
          staff_id: selectedStaff.id,
          branch_id: branchId,
          is_default: branchId === defaultBranch,
        }));

        const { error: insertError } = await supabase
          .from("staff_branches")
          .insert(assignments);

        if (insertError) throw insertError;
      }

      // Update default branch in profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ default_branch_id: defaultBranch })
        .eq("id", selectedStaff.id);

      if (profileError) throw profileError;

      toast({
        title: "Success",
        description: "Staff branch assignments updated successfully",
      });

      setDialogOpen(false);
      fetchStaff();
      onUpdate();
    } catch (error) {
      console.error("Error saving assignments:", error);
      toast({
        title: "Error",
        description: "Failed to save branch assignments",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleBranch = (branchId: string) => {
    setSelectedBranches((prev) => {
      if (prev.includes(branchId)) {
        const newBranches = prev.filter((id) => id !== branchId);
        // If removing the default branch, clear default
        if (branchId === defaultBranch) {
          setDefaultBranch(null);
        }
        return newBranches;
      } else {
        return [...prev, branchId];
      }
    });
  };

  const setAsDefault = (branchId: string) => {
    if (selectedBranches.includes(branchId)) {
      setDefaultBranch(branchId);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading staff...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5" />
        <h2 className="text-xl font-semibold">Staff Branch Assignments</h2>
      </div>

      <div className="grid gap-4">
        {staff.map((staffMember) => {
          const assignedBranchNames = branches
            .filter((b) => staffMember.assigned_branches.includes(b.id))
            .map((b) => b.name);

          const defaultBranchName = branches.find(
            (b) => b.id === staffMember.default_branch_id
          )?.name;

          return (
            <Card key={staffMember.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div>
                    <h3 className="font-medium">{staffMember.full_name || "Unnamed Staff"}</h3>
                    <p className="text-sm text-muted-foreground">{staffMember.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {assignedBranchNames.length > 0 ? (
                      assignedBranchNames.map((branchName, idx) => (
                        <Badge
                          key={idx}
                          variant={branchName === defaultBranchName ? "default" : "secondary"}
                        >
                          {branchName}
                          {branchName === defaultBranchName && (
                            <Star className="w-3 h-3 ml-1 fill-current" />
                          )}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No branches assigned</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditStaff(staffMember)}
                >
                  Manage Branches
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Branch Assignments</DialogTitle>
            <DialogDescription>
              Assign {selectedStaff?.full_name} to branches and set a default branch
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {branches.map((branch) => (
              <div
                key={branch.id}
                className="flex items-center justify-between space-x-2 p-3 rounded-lg border"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <Checkbox
                    id={`branch-${branch.id}`}
                    checked={selectedBranches.includes(branch.id)}
                    onCheckedChange={() => toggleBranch(branch.id)}
                  />
                  <Label
                    htmlFor={`branch-${branch.id}`}
                    className="cursor-pointer flex-1"
                  >
                    {branch.name}
                  </Label>
                </div>
                {selectedBranches.includes(branch.id) && (
                  <Button
                    variant={defaultBranch === branch.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setAsDefault(branch.id)}
                    className="h-8"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        defaultBranch === branch.id ? "fill-current" : ""
                      }`}
                    />
                  </Button>
                )}
              </div>
            ))}
            {branches.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No branches available
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
