import { Building2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserBranches } from "@/hooks/useUserBranches";
import { useBranch } from "@/contexts/BranchContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export const BranchSwitcher = () => {
  const { branches } = useUserBranches();
  const { selectedBranch, setSelectedBranch } = useBranch();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (branches.length <= 1) {
    return null;
  }

  const handleBranchChange = (branch: any) => {
    setSelectedBranch(branch);
    toast({
      title: "Branch Changed",
      description: `Switched to ${branch.name}`,
    });
    // Optionally reload data or navigate
    window.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: selectedBranch?.color_theme || "#6366f1" }}
            />
            <Building2 className="w-4 h-4" />
            <span className="truncate">
              {selectedBranch?.name || "Select Branch"}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px]">
        {branches.map((branch) => (
          <DropdownMenuItem
            key={branch.id}
            onClick={() => handleBranchChange(branch)}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-2 w-full">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: branch.color_theme || "#6366f1" }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{branch.name}</div>
                {branch.address && (
                  <div className="text-xs text-muted-foreground truncate">
                    {branch.address}
                  </div>
                )}
              </div>
              {selectedBranch?.id === branch.id && (
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
