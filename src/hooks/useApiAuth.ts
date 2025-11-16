import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  fullName?: string;
}

interface AuthState {
  user: User | null;
  role: string | null;
  branchIds: string[];
  defaultBranch: string | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export const useApiAuth = () => {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    role: null,
    branchIds: [],
    defaultBranch: null,
    loading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const token = apiClient.getToken();
    
    if (!token) {
      setAuthState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const session = await apiClient.getSession();
      setAuthState({
        user: session.user,
        role: session.role,
        branchIds: session.branchIds,
        defaultBranch: session.branchIds[0] || null,
        loading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('Session check failed:', error);
      apiClient.clearTokens();
      setAuthState({
        user: null,
        role: null,
        branchIds: [],
        defaultBranch: null,
        loading: false,
        isAuthenticated: false,
      });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const data = await apiClient.login(email, password);
      
      setAuthState({
        user: data.user,
        role: data.role,
        branchIds: data.branchIds,
        defaultBranch: data.defaultBranch,
        loading: false,
        isAuthenticated: true,
      });

      toast.success('Login successful!');
      
      // Navigate based on role
      navigate(data.role === 'admin' ? '/admin' : '/dashboard');
      
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthState({
        user: null,
        role: null,
        branchIds: [],
        defaultBranch: null,
        loading: false,
        isAuthenticated: false,
      });
      navigate('/auth');
    }
  };

  return {
    ...authState,
    login,
    logout,
    checkSession,
  };
};
