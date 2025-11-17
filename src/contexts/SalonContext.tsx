import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Salon interface for multi-tenant architecture
interface Salon {
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
  owner_user_id: string | null;
  is_active: boolean | null;
}

interface SalonContextType {
  selectedSalon: Salon | null;
  setSelectedSalon: (salon: Salon | null) => void;
  clearSelectedSalon: () => void;
}

const SalonContext = createContext<SalonContextType | undefined>(undefined);

export const SalonProvider = ({ children }: { children: ReactNode }) => {
  const [selectedSalon, setSelectedSalonState] = useState<Salon | null>(() => {
    const stored = localStorage.getItem("selectedSalon");
    return stored ? JSON.parse(stored) : null;
  });

  const setSelectedSalon = (salon: Salon | null) => {
    setSelectedSalonState(salon);
    if (salon) {
      localStorage.setItem("selectedSalon", JSON.stringify(salon));
    } else {
      localStorage.removeItem("selectedSalon");
    }
  };

  const clearSelectedSalon = () => {
    setSelectedSalonState(null);
    localStorage.removeItem("selectedSalon");
  };

  return (
    <SalonContext.Provider value={{ selectedSalon, setSelectedSalon, clearSelectedSalon }}>
      {children}
    </SalonContext.Provider>
  );
};

export const useSalon = () => {
  const context = useContext(SalonContext);
  if (!context) {
    throw new Error("useSalon must be used within a SalonProvider");
  }
  return context;
};

// Backward compatibility exports
export { SalonProvider as BranchProvider };
export { useSalon as useBranch };
export type { Salon as Branch };
