import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  color_theme: string | null;
  opening_hours: any;
  gps_latitude: number | null;
  gps_longitude: number | null;
  gps_radius_meters: number | null;
  acsu_points_per_dollar: number | null;
  acsu_bonus_multiplier: number | null;
  manager_id: string | null;
  is_active: boolean | null;
}

interface BranchContextType {
  selectedBranch: Branch | null;
  setSelectedBranch: (branch: Branch | null) => void;
  clearSelectedBranch: () => void;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export const BranchProvider = ({ children }: { children: ReactNode }) => {
  const [selectedBranch, setSelectedBranchState] = useState<Branch | null>(() => {
    const stored = localStorage.getItem("selectedBranch");
    return stored ? JSON.parse(stored) : null;
  });

  const setSelectedBranch = (branch: Branch | null) => {
    setSelectedBranchState(branch);
    if (branch) {
      localStorage.setItem("selectedBranch", JSON.stringify(branch));
    } else {
      localStorage.removeItem("selectedBranch");
    }
  };

  const clearSelectedBranch = () => {
    setSelectedBranchState(null);
    localStorage.removeItem("selectedBranch");
  };

  return (
    <BranchContext.Provider value={{ selectedBranch, setSelectedBranch, clearSelectedBranch }}>
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error("useBranch must be used within a BranchProvider");
  }
  return context;
};
