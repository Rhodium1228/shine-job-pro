import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from './api-client';

interface User {
  id: string;
  email: string;
  fullName?: string;
}

interface ApiContextValue {
  user: User | null;
  role: string | null;
  branchIds: string[];
  defaultBranch: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const ApiContext = createContext<ApiContextValue | undefined>(undefined);

export const ApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [defaultBranch, setDefaultBranch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const token = apiClient.getToken();
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const session = await apiClient.getSession();
      setUser(session.user);
      setRole(session.role);
      setBranchIds(session.branchIds);
      setDefaultBranch(session.branchIds[0] || null);
    } catch (error) {
      console.error('Session check failed:', error);
      apiClient.clearTokens();
      setUser(null);
      setRole(null);
      setBranchIds([]);
      setDefaultBranch(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const data = await apiClient.login(email, password);
      
      setUser(data.user);
      setRole(data.role);
      setBranchIds(data.branchIds);
      setDefaultBranch(data.defaultBranch);
      
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setRole(null);
      setBranchIds([]);
      setDefaultBranch(null);
    }
  };

  return (
    <ApiContext.Provider
      value={{
        user,
        role,
        branchIds,
        defaultBranch,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        checkSession,
      }}
    >
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within ApiProvider');
  }
  return context;
};
