import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requiredRole?: 'owner' | 'admin' | 'user';
  fallbackPath?: string;
  showLoginPrompt?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requireAuth = true,
  requiredRole,
  fallbackPath = '/auth',
  showLoginPrompt = true
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;

    // Check if authentication is required
    if (requireAuth && !isAuthenticated) {
      if (showLoginPrompt) {
        // Store current path to redirect back after login
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      }
      setLocation(fallbackPath);
      return;
    }

    // Check role requirements
    if (requiredRole && user) {
      const hasAccess = checkRoleAccess(user.role, requiredRole);
      if (!hasAccess) {
        setLocation('/unauthorized');
        return;
      }
    }
  }, [isAuthenticated, user, isLoading, requireAuth, requiredRole, fallbackPath, setLocation, showLoginPrompt]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-nxe-dark flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // If auth required but not authenticated, don't render children
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // If specific role required but user doesn't have access, don't render children
  if (requiredRole && user && !checkRoleAccess(user.role, requiredRole)) {
    return null;
  }

  return <>{children}</>;
}

function checkRoleAccess(userRole: string, requiredRole: string): boolean {
  // Owner has access to everything
  if (userRole === 'owner') return true;
  
  // Admin has access to admin and user features
  if (userRole === 'admin' && (requiredRole === 'admin' || requiredRole === 'user')) return true;
  
  // User has access to user features
  if (userRole === 'user' && requiredRole === 'user') return true;
  
  return false;
}

// Component untuk features yang memerlukan login
export function RequireAuth({ children, requiredRole }: { children: ReactNode, requiredRole?: 'owner' | 'admin' | 'user' }) {
  return (
    <ProtectedRoute requireAuth={true} requiredRole={requiredRole}>
      {children}
    </ProtectedRoute>
  );
}

// Component untuk guest access (tidak perlu login)
export function GuestRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requireAuth={false}>
      {children}
    </ProtectedRoute>
  );
}