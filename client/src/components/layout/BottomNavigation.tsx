import { RefreshCcw, MessageSquare, Plus, Wallet, Settings, LogIn, LogOut, User } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

interface NavItem {
  path: string;
  icon: React.ComponentType<any>;
  label: string;
  isSpecial?: boolean;
  disabled?: boolean;
  badge?: number | boolean | null;
}

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  // Query for notification badges - MUST be called before any early returns
  const { data: unreadChats = 0 } = useQuery<number>({
    queryKey: ["/api/chats/unread"],
    enabled: isAuthenticated
  });

  const { data: walletNotifications = false } = useQuery<boolean>({
    queryKey: ["/api/wallet/notifications"], 
    enabled: isAuthenticated
  });

  // Hide bottom navigation on pages that should only use back button navigation
  // This matches the TopNavbar hiding logic for consistency
  const hideBottomNavigation = location === '/auth' || 
                                location === '/upload' || 
                                location.startsWith('/upload/') ||
                                location === '/settings' || 
                                location.startsWith('/settings/') ||
                                location === '/qrcode' || 
                                location === '/chat' || 
                                location.startsWith('/chat/');
  
  if (hideBottomNavigation) {
    return null;
  }

  // Guest navigation items - only Market and Login
  const guestNavItems: NavItem[] = [
    { path: "/", icon: RefreshCcw, label: "Pembaruan" },
    { path: "/guest-status", icon: User, label: "Tamu" }, // Gray guest icon
    { path: "/auth", icon: LogIn, label: "Masuk" },
  ];

  // Authenticated user navigation items - sesuai gambar
  const authNavItems: NavItem[] = [
    { path: "/", icon: RefreshCcw, label: "Pembaruan" },
    { path: "/chat", icon: MessageSquare, label: "Chat", badge: unreadChats > 0 ? unreadChats : null },
    { path: "/upload", icon: Plus, label: "Posting", isSpecial: true },
    { path: "/wallet", icon: Wallet, label: "ewallet", badge: walletNotifications },
    { path: "/settings", icon: Settings, label: "pengaturan" },
  ];

  const navItems = isAuthenticated ? authNavItems : guestNavItems;

  const handleNavClick = (path: string, disabled?: boolean) => {
    if (disabled) {
      // Show toast for disabled items
      return;
    }
    // Handle guest status - don't navigate, it's just a status indicator
    if (path === "/guest-status") {
      return;
    }
    setLocation(path);
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-40 bottom-nav-safe keyboard-smooth gpu-accelerated"
      role="navigation"
    >
      {/* Glassmorphism background dengan mobile optimization */}
      <div className="nxe-glass backdrop-blur-xl bg-nxe-surface/95 border-t border-nxe-primary/30 shadow-2xl">
        <div className="flex items-center justify-around px-3 py-2 max-w-md mx-auto">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            const hasNotificationBadge = item.badge && (typeof item.badge === 'number' ? item.badge > 0 : item.badge);
            
            // Center FAB for special items (Posting)
            if (item.isSpecial) {
              return (
                <div key={item.path} className="relative flex flex-col items-center">
                  <Button
                    onClick={() => handleNavClick(item.path)}
                    className="relative group p-0 hover:bg-transparent"
                    variant="ghost"
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    {/* Center FAB optimized for mobile - removed blur circle */}
                    <div className="flex items-center justify-center group-hover:scale-110 group-active:scale-95 transition-all duration-200">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </Button>
                  <span className="text-xs font-medium text-white mt-1">
                    {item.label}
                  </span>
                </div>
              );
            }

            // Regular nav items
            const isGuestStatus = item.path === "/guest-status";
            return (
              <div key={item.path} className="relative flex flex-col items-center">
                <Button
                  onClick={() => handleNavClick(item.path, item.disabled)}
                  className={`flex flex-col items-center p-2 transition-all duration-300 hover:bg-transparent group ${
                    item.disabled ? 'opacity-40 cursor-not-allowed' : ''
                  } ${isGuestStatus ? 'cursor-default' : ''}`}
                  variant="ghost"
                  disabled={item.disabled || isGuestStatus}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                >
                  <div className="relative">
                    {/* Icon container optimized for mobile */}
                    <div className={`relative p-2 rounded-full transition-all duration-300 transform ${
                      isActive 
                        ? "bg-nxe-primary/15 text-nxe-primary shadow-md scale-105" 
                        : isGuestStatus 
                        ? "text-gray-400 bg-gray-100/50 dark:bg-gray-800/50"
                        : "text-gray-400 group-hover:text-nxe-primary group-hover:bg-nxe-primary/10 group-hover:scale-105"
                    }`}>
                      <Icon className={`h-5 w-5 transition-all duration-300 ${
                        isActive ? "drop-shadow-sm" : ""
                      }`} />
                      
                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-nxe-primary rounded-full" />
                      )}
                      
                      {/* New notification concept - subtle green indicators */}
                      {hasNotificationBadge && (
                        <>
                          {/* Green glow effect around icon when notifications are present */}
                          <div className="absolute inset-0 rounded-full bg-green-500/20 animate-pulse" />
                          
                          {/* Small green notification dot - positioned at bottom-right */}
                          <div className="absolute -bottom-1 -right-1 flex items-center justify-center">
                            <div className="relative">
                              {/* Pulsing green dot */}
                              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg" />
                              {/* Subtle ripple effect */}
                              <div className="absolute inset-0 w-3 h-3 bg-green-500/30 rounded-full animate-ping" />
                              
                              {/* Show count for chat notifications */}
                              {item.label === "Chat" && typeof item.badge === 'number' && item.badge > 0 && (
                                <div className="absolute -top-1 -right-1 min-w-[14px] h-[14px] bg-green-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-nxe-surface">
                                  {item.badge > 9 ? '9+' : item.badge}
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </Button>
                
                {/* Label positioned outside button for better mobile UX */}
                <span className={`text-xs font-medium mt-0.5 transition-all duration-300 ${
                  isActive 
                    ? "text-nxe-primary font-semibold" 
                    : isGuestStatus
                    ? "text-gray-400"
                    : "text-gray-400"
                }`}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
