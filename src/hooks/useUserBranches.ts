import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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

interface StaffBranch {
  branch_id: string;
  is_default: boolean;
  branches: Branch;
}

export const useUserBranches = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [defaultBranch, setDefaultBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserBranches();
  }, []);

  const fetchUserBranches = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("staff_branches")
        .select(`
          branch_id,
          is_default,
          branches (*)
        `)
        .eq("staff_id", user.id);

      if (error) throw error;

      const staffBranches = data as StaffBranch[];
      const branchList = staffBranches.map(sb => sb.branches);
      setBranches(branchList);

      const defaultBranchData = staffBranches.find(sb => sb.is_default);
      if (defaultBranchData) {
        setDefaultBranch(defaultBranchData.branches);
      } else if (branchList.length > 0) {
        setDefaultBranch(branchList[0]);
      }
    } catch (error) {
      console.error("Error fetching user branches:", error);
    } finally {
      setLoading(false);
    }
  };

  return { branches, defaultBranch, loading, refetch: fetchUserBranches };
};
