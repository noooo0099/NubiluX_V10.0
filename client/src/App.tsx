import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect, Suspense, lazy } from "react";

// Layout components
import TopNavbar from "@/components/layout/TopNavbar";
import BottomNavigation from "@/components/layout/BottomNavigation";
import NotificationModal from "@/components/layout/NotificationModal";

// Pages
import Home from "@/pages/Home";
import Video from "@/pages/Video";
import Upload from "@/pages/Upload";
import Wallet from "@/pages/Wallet";
import Settings from "@/pages/Settings";
import Chat from "@/pages/Chat";
import Profile from "@/pages/Profile";
import ProductDetail from "@/pages/ProductDetail";
import AdminPanel from "@/pages/AdminPanel";
import AIEscrowSystem from "@/pages/AIEscrowSystem";
import Auth from "@/pages/Auth";
import Unauthorized from "@/pages/Unauthorized";
import NotFound from "@/pages/not-found";
import Categories from "@/pages/Categories";
import CategoryProducts from "@/pages/CategoryProducts";
import StatusUpdates from "@/pages/StatusUpdates";
import TransactionHistory from "@/pages/TransactionHistory";
import Notifications from "@/pages/Notifications";
import SearchResults from "@/pages/SearchResults";
import SellerDashboard from "@/pages/SellerDashboard";
import Help from "@/pages/Help";

// Auth components
import { AuthProvider } from "@/contexts/AuthContext";
import { RequireAuth } from "@/components/auth/ProtectedRoute";

// Theme provider
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <div className="min-h-screen bg-nxe-dark text-white">
      {children}
    </div>
  );
}

function Router() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [location] = useLocation();
  
  // Hide TopNavbar on auth pages (login/register)
  const hideTopNavbar = location === '/auth';

  return (
    <div className="min-h-screen bg-nxe-dark">
      {!hideTopNavbar && (
        <TopNavbar 
          onShowNotifications={() => setShowNotifications(true)}
        />
      )}
      
      <main className={hideTopNavbar ? "min-h-screen" : "pb-20 min-h-screen"}>
        <Switch>
          {/* Public routes - Guest dapat akses */}
          <Route path="/" component={Home} />
          <Route path="/market" component={Home} />
          <Route path="/categories" component={Categories} />
          <Route path="/category/:categoryId" component={CategoryProducts} />
          <Route path="/search" component={SearchResults} />
          <Route path="/help" component={Help} />
          <Route path="/auth" component={Auth} />
          <Route path="/unauthorized" component={Unauthorized} />
          <Route path="/product/:id" component={ProductDetail} />
          
          {/* Protected routes - Memerlukan login */}
          <Route path="/video">
            {() => (
              <RequireAuth>
                <Video />
              </RequireAuth>
            )}
          </Route>
          <Route path="/upload">
            {() => (
              <RequireAuth>
                <Upload />
              </RequireAuth>
            )}
          </Route>
          <Route path="/wallet">
            {() => (
              <RequireAuth>
                <Wallet />
              </RequireAuth>
            )}
          </Route>
          <Route path="/settings">
            {() => (
              <RequireAuth>
                <Settings />
              </RequireAuth>
            )}
          </Route>
          <Route path="/chat">
            {() => (
              <RequireAuth>
                <Chat />
              </RequireAuth>
            )}
          </Route>
          <Route path="/chat/:id">
            {() => (
              <RequireAuth>
                <Chat />
              </RequireAuth>
            )}
          </Route>
          <Route path="/profile/:id">
            {() => (
              <RequireAuth>
                <Profile />
              </RequireAuth>
            )}
          </Route>
          <Route path="/profile">
            {() => (
              <RequireAuth>
                <Profile />
              </RequireAuth>
            )}
          </Route>
          <Route path="/notifications">
            {() => (
              <RequireAuth>
                <Notifications />
              </RequireAuth>
            )}
          </Route>
          <Route path="/status">
            {() => (
              <RequireAuth>
                <StatusUpdates />
              </RequireAuth>
            )}
          </Route>
          <Route path="/transactions">
            {() => (
              <RequireAuth>
                <TransactionHistory />
              </RequireAuth>
            )}
          </Route>
          <Route path="/seller/dashboard">
            {() => (
              <RequireAuth>
                <SellerDashboard />
              </RequireAuth>
            )}
          </Route>
          
          {/* Admin routes - Memerlukan role admin atau owner */}
          <Route path="/admin">
            {() => (
              <RequireAuth requiredRole="admin">
                <AdminPanel />
              </RequireAuth>
            )}
          </Route>
          <Route path="/admin/escrow">
            {() => (
              <RequireAuth requiredRole="admin">
                <AIEscrowSystem />
              </RequireAuth>
            )}
          </Route>
          
          <Route path="/settings/user-role">
            {() => {
              const UserRole = lazy(() => import("./pages/settings/UserRole"));
              return (
                <RequireAuth>
                  <Suspense fallback={<div className="min-h-screen bg-nxe-dark flex items-center justify-center"><div className="text-nxe-text">Loading...</div></div>}>
                    <UserRole />
                  </Suspense>
                </RequireAuth>
              );
            }}
          </Route>
          <Route path="/settings/notifications">
            {() => {
              const NotificationPreferences = lazy(() => import("./pages/settings/NotificationPreferences"));
              return (
                <RequireAuth>
                  <Suspense fallback={<div className="min-h-screen bg-nxe-dark flex items-center justify-center"><div className="text-nxe-text">Loading...</div></div>}>
                    <NotificationPreferences />
                  </Suspense>
                </RequireAuth>
              );
            }}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>

      <BottomNavigation />
      
      <NotificationModal 
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <ThemeProvider>
            <Toaster />
            <Router />
          </ThemeProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
