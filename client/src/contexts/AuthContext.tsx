import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest, setAuthToken, removeAuthToken } from '@/lib/queryClient';

interface User {
  id: number;
  username: string;
  email: string;
  displayName?: string;
  profilePicture?: string;
  bio?: string;
  role: 'owner' | 'admin' | 'user';
  isVerified: boolean;
  walletBalance: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on app start
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Verify token with backend
      const response = await apiRequest('/api/user');
      setUser(response);
    } catch (error) {
      // Token invalid, remove it
      removeAuthToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiRequest('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (response.token) {
        setAuthToken(response.token);
        setUser(response.user);
      } else {
        throw new Error('Invalid login response');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await apiRequest('/api/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      if (response.token) {
        setAuthToken(response.token);
        setUser(response.user);
      } else {
        throw new Error('Invalid registration response');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    
    // Call logout endpoint to invalidate token on server
    apiRequest('/api/logout', { method: 'POST' }).catch(() => {
      // Ignore errors, token already removed locally
    });
  };

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    checkAuth,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook untuk check apakah user adalah Guest
export function useIsGuest() {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated;
}

// Hook untuk check role user
export function useUserRole() {
  const { user } = useAuth();
  return user?.role || 'guest';
}

// Hook untuk check apakah user adalah Owner
export function useIsOwner() {
  const { user } = useAuth();
  return user?.role === 'owner';
}

// Hook untuk check apakah user adalah Admin atau Owner
export function useIsAdmin() {
  const { user } = useAuth();
  return user?.role === 'admin' || user?.role === 'owner';
}