import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, MapPin, Phone, Mail, Clock, TrendingUp, LogOut } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserBranches } from "@/hooks/useUserBranches";
import { useBranch } from "@/contexts/BranchContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const BranchSelector = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { branches, loading } = useUserBranches();
  const { setSelectedBranch } = useBranch();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    // If user has only one branch, auto-select it
    if (!loading && branches.length === 1) {
      setSelectedBranch(branches[0]);
      navigate(`/app/${branches[0].id}/dashboard`);
    }
  }, [branches, loading, setSelectedBranch, navigate]);

  const handleBranchSelect = (branch: any) => {
    setSelectedBranch(branch);
    toast({
      title: "Branch Selected",
      description: `You are now working at ${branch.name}`,
    });
    // Navigate to tenant-scoped dashboard
    navigate(`/app/${branch.id}/dashboard`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your branches...</p>
        </div>
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="p-8 text-center max-w-md">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">No Branches Assigned</h2>
          <p className="text-muted-foreground mb-6">
            You haven't been assigned to any branches yet. Please contact your administrator.
          </p>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="gradient-primary text-white p-8 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">Select Your Branch</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white hover:bg-white/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
          <p className="text-white/80">Choose which location you're working at today</p>
        </div>
      </div>

      {/* Branch Cards */}
      <div className="max-w-6xl mx-auto px-6 -mt-8 pb-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <Card
              key={branch.id}
              className={`group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${
                hoveredCard === branch.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => handleBranchSelect(branch)}
              onMouseEnter={() => setHoveredCard(branch.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Color Header */}
              <div
                className="h-32 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${branch.color_theme || "#6366f1"} 0%, ${branch.color_theme || "#6366f1"}dd 100%)`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                <div className="relative h-full flex items-center justify-center">
                  <Building2 className="w-16 h-16 text-white opacity-90" />
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {branch.name}
                  </h3>
                  {branch.address && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{branch.address}</span>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="space-y-2 text-sm">
                  {branch.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{branch.phone}</span>
                    </div>
                  )}
                  {branch.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{branch.email}</span>
                    </div>
                  )}
                </div>

                {/* ACSU Info */}
                {(branch.acsu_points_per_dollar || branch.acsu_bonus_multiplier) && (
                  <div className="pt-3 border-t space-y-2">
                    {branch.acsu_points_per_dollar && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          ACSU Points
                        </span>
                        <span className="font-semibold">
                          {branch.acsu_points_per_dollar} pts/$1
                        </span>
                      </div>
                    )}
                    {branch.acsu_bonus_multiplier && branch.acsu_bonus_multiplier !== 1 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Bonus Multiplier</span>
                        <span className="font-semibold text-primary">
                          {branch.acsu_bonus_multiplier}x
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Select Button */}
                <Button
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                  variant="outline"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Start Working Here
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            You can change your branch later from the profile settings
          </p>
        </div>
      </div>
    </div>
  );
};

export default BranchSelector;
