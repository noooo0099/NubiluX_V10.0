import { Store, Zap, Plus, MessageSquare, Wallet, LogIn } from "lucide-react";
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

  // Query for notification badges
  const { data: unreadChats = 0 } = useQuery<number>({
    queryKey: ["/api/chats/unread"],
    enabled: isAuthenticated
  });

  const { data: walletNotifications = false } = useQuery<boolean>({
    queryKey: ["/api/wallet/notifications"], 
    enabled: isAuthenticated
  });

  // Guest navigation items - focused on core discovery and login
  const guestNavItems: NavItem[] = [
    { path: "/market", icon: Store, label: "Pasar" },
    { path: "/auth", icon: LogIn, label: "Masuk", isSpecial: true },
    { path: "/chat", icon: MessageSquare, label: "Chat", disabled: true },
    { path: "/wallet", icon: Wallet, label: "Dompet", disabled: true },
  ];

  // Authenticated user navigation items - marketplace-first design
  const authNavItems: NavItem[] = [
    { path: "/market", icon: Store, label: "Pasar" },
    { path: "/", icon: Zap, label: "Pembaruan" },
    { path: "/upload", icon: Plus, label: "Jual", isSpecial: true },
    { path: "/chat", icon: MessageSquare, label: "Chat", badge: unreadChats > 0 ? unreadChats : null },
    { path: "/wallet", icon: Wallet, label: "Dompet", badge: walletNotifications },
  ];

  const navItems = isAuthenticated ? authNavItems : guestNavItems;

  const handleNavClick = (path: string, disabled?: boolean) => {
    if (disabled) {
      // Show toast for disabled items
      return;
    }
    setLocation(path);
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
      role="navigation"
    >
      {/* Glassmorphism background */}
      <div className="nxe-glass backdrop-blur-xl bg-nxe-surface/90 border-t border-nxe-primary/20 shadow-2xl">
        <div className="flex items-end justify-around px-2 py-3">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            const hasNotificationBadge = item.badge && (typeof item.badge === 'number' ? item.badge > 0 : item.badge);
            
            // Center FAB for special items (Jual/Masuk)
            if (item.isSpecial) {
              return (
                <div key={item.path} className="relative">
                  <Button
                    onClick={() => handleNavClick(item.path)}
                    className="relative group"
                    variant="ghost"
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    <div className="flex flex-col items-center">
                      {/* Center FAB */}
                      <div className="w-14 h-14 bg-gradient-to-br from-nxe-primary via-nxe-primary to-nxe-accent rounded-full flex items-center justify-center mb-1 shadow-lg group-hover:scale-110 group-active:scale-95 transition-all duration-200 animate-pulse">
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <span className="text-xs font-medium text-nxe-primary">
                        {item.label}
                      </span>
                    </div>
                  </Button>
                </div>
              );
            }

            // Regular nav items
            return (
              <div key={item.path} className="relative">
                <Button
                  onClick={() => handleNavClick(item.path, item.disabled)}
                  className={`flex flex-col items-center p-3 transition-all duration-200 hover:bg-transparent group ${
                    item.disabled ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                  variant="ghost"
                  disabled={item.disabled}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                >
                  <div className="relative">
                    {/* Icon container with active state */}
                    <div className={`relative p-2.5 rounded-full transition-all duration-300 ${
                      isActive 
                        ? "bg-nxe-primary/20 text-nxe-primary shadow-md" 
                        : "text-gray-400 group-hover:text-nxe-primary group-hover:bg-nxe-primary/10"
                    }`}>
                      <Icon className="h-5 w-5" />
                      
                      {/* Notification badge */}
                      {hasNotificationBadge && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs min-w-4 rounded-full bg-red-500 text-white border-2 border-nxe-surface"
                        >
                          {typeof item.badge === 'number' && item.badge > 9 ? '9+' : item.badge === true ? '•' : item.badge}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Label */}
                  <span className={`text-xs font-medium mt-1 transition-colors duration-200 ${
                    isActive 
                      ? "text-nxe-primary" 
                      : "text-gray-400 group-hover:text-nxe-primary"
                  }`}>
                    {item.label}
                  </span>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
