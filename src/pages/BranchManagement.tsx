import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Building2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StaffBranchAssignment } from "@/components/StaffBranchAssignment";

interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  color_theme: string | null;
  acsu_points_per_dollar: number | null;
  acsu_bonus_multiplier: number | null;
  is_active: boolean | null;
}

const BranchManagement = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [branchToDelete, setbranchToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    color_theme: "#6366f1",
    acsu_points_per_dollar: "1.00",
    acsu_bonus_multiplier: "1.00",
  });

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [isAdmin, roleLoading, navigate, toast]);

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setBranches(data || []);
    } catch (error) {
      console.error("Error fetching branches:", error);
      toast({
        title: "Error",
        description: "Failed to load branches",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchBranches();
    }
  }, [isAdmin]);

  const handleEdit = (branch: Branch) => {
    setSelectedBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address || "",
      phone: branch.phone || "",
      email: branch.email || "",
      color_theme: branch.color_theme || "#6366f1",
      acsu_points_per_dollar: branch.acsu_points_per_dollar?.toString() || "1.00",
      acsu_bonus_multiplier: branch.acsu_bonus_multiplier?.toString() || "1.00",
    });
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedBranch(null);
    setFormData({
      name: "",
      address: "",
      phone: "",
      email: "",
      color_theme: "#6366f1",
      acsu_points_per_dollar: "1.00",
      acsu_bonus_multiplier: "1.00",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const branchData = {
        name: formData.name,
        address: formData.address || null,
        phone: formData.phone || null,
        email: formData.email || null,
        color_theme: formData.color_theme,
        acsu_points_per_dollar: parseFloat(formData.acsu_points_per_dollar),
        acsu_bonus_multiplier: parseFloat(formData.acsu_bonus_multiplier),
      };

      if (selectedBranch) {
        const { error } = await supabase
          .from("branches")
          .update(branchData)
          .eq("id", selectedBranch.id);

        if (error) throw error;
        toast({ title: "Success", description: "Branch updated successfully" });
      } else {
        const { error } = await supabase.from("branches").insert(branchData);

        if (error) throw error;
        toast({ title: "Success", description: "Branch created successfully" });
      }

      setDialogOpen(false);
      fetchBranches();
    } catch (error) {
      console.error("Error saving branch:", error);
      toast({
        title: "Error",
        description: "Failed to save branch",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (id: string) => {
    setbranchToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!branchToDelete) return;

    try {
      const { error } = await supabase
        .from("branches")
        .delete()
        .eq("id", branchToDelete);

      if (error) throw error;

      toast({ title: "Success", description: "Branch deleted successfully" });
      fetchBranches();
    } catch (error) {
      console.error("Error deleting branch:", error);
      toast({
        title: "Error",
        description: "Failed to delete branch",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setbranchToDelete(null);
    }
  };

  if (roleLoading || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="gradient-primary text-white p-6 pb-8 rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Branch Management</h1>
              <p className="text-white/80 text-sm">Manage business locations</p>
            </div>
          </div>
          <Button
            onClick={handleCreate}
            className="bg-white text-primary hover:bg-white/90"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Branch
          </Button>
        </div>
      </div>

      <div className="p-6">
        <Tabs defaultValue="branches" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="branches">Branches</TabsTrigger>
            <TabsTrigger value="staff">Staff Assignments</TabsTrigger>
          </TabsList>

          <TabsContent value="branches" className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
                <p className="text-muted-foreground">Loading branches...</p>
              </div>
            ) : branches.length === 0 ? (
              <Card className="p-12 text-center">
                <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No branches yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first branch to get started
                </p>
                <Button onClick={handleCreate}>
                  <Plus className="w-5 h-5 mr-2" />
                  Create Branch
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {branches.map((branch) => (
              <Card key={branch.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: branch.color_theme || "#6366f1" }}
                    >
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{branch.name}</h3>
                      {branch.address && (
                        <p className="text-sm text-muted-foreground">{branch.address}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(branch)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteClick(branch.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-1 text-sm">
                  {branch.phone && (
                    <p className="text-muted-foreground">📞 {branch.phone}</p>
                  )}
                  {branch.email && (
                    <p className="text-muted-foreground">✉️ {branch.email}</p>
                  )}
                  <p className="text-muted-foreground">
                    💰 ACSU: {branch.acsu_points_per_dollar} pts/$1 • {branch.acsu_bonus_multiplier}x bonus
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
          </TabsContent>

          <TabsContent value="staff">
            <StaffBranchAssignment branches={branches} onUpdate={fetchBranches} />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedBranch ? "Edit Branch" : "Create Branch"}
            </DialogTitle>
            <DialogDescription>
              {selectedBranch
                ? "Update branch information"
                : "Add a new business location"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Branch Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Cranbourne Salon"
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="123 Main St, City"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="(03) 1234 5678"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="branch@example.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="color">Brand Color</Label>
              <Input
                id="color"
                type="color"
                value={formData.color_theme}
                onChange={(e) =>
                  setFormData({ ...formData, color_theme: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="points">ACSU Points per $1</Label>
                <Input
                  id="points"
                  type="number"
                  step="0.01"
                  value={formData.acsu_points_per_dollar}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      acsu_points_per_dollar: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="bonus">ACSU Bonus Multiplier</Label>
                <Input
                  id="bonus"
                  type="number"
                  step="0.01"
                  value={formData.acsu_bonus_multiplier}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      acsu_bonus_multiplier: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.name}>
              {selectedBranch ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Branch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this branch? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BranchManagement;
