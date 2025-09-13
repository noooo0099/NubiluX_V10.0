import { Switch, Route } from "wouter";
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
import NotFound from "@/pages/not-found";

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

  return (
    <div className="min-h-screen bg-nxe-dark">
      <TopNavbar 
        onShowNotifications={() => setShowNotifications(true)}
      />
      
      <main className="pb-20 min-h-screen">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/video" component={Video} />
          <Route path="/upload" component={Upload} />
          <Route path="/wallet" component={Wallet} />
          <Route path="/settings" component={Settings} />
          <Route path="/chat" component={Chat} />
          <Route path="/chat/:id" component={Chat} />
          <Route path="/profile/:id" component={Profile} />
          <Route path="/profile" component={Profile} />
          <Route path="/product/:id" component={ProductDetail} />
          <Route path="/admin" component={AdminPanel} />
          <Route path="/admin/escrow" component={AIEscrowSystem} />
          <Route path="/settings/user-role">
            {() => {
              const UserRole = lazy(() => import("./pages/settings/UserRole"));
              return (
                <Suspense fallback={<div className="min-h-screen bg-nxe-dark flex items-center justify-center"><div className="text-nxe-text">Loading...</div></div>}>
                  <UserRole />
                </Suspense>
              );
            }}
          </Route>
          <Route path="/settings/notifications">
            {() => {
              const NotificationPreferences = lazy(() => import("./pages/settings/NotificationPreferences"));
              return (
                <Suspense fallback={<div className="min-h-screen bg-nxe-dark flex items-center justify-center"><div className="text-nxe-text">Loading...</div></div>}>
                  <NotificationPreferences />
                </Suspense>
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
      <TooltipProvider>
        <ThemeProvider>
          <Toaster />
          <Router />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
