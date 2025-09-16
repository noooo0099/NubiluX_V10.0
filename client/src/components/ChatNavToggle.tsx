import { useState } from "react";
import { RefreshCcw, MessageSquare, Plus, Wallet, Settings, LogIn, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

interface NavOption {
  path: string;
  icon: React.ComponentType<any>;
  label: string;
  isSpecial?: boolean;
  badge?: number | boolean | null;
}

export default function ChatNavToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
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

  // Navigation options matching bottom navbar design
  const guestNavOptions: NavOption[] = [
    { path: "/", icon: RefreshCcw, label: "PEMBARUAN" },
    { path: "/guest-status", icon: User, label: "TAMU" },
    { path: "/auth", icon: LogIn, label: "MASUK" },
  ];

  const authNavOptions: NavOption[] = [
    { path: "/", icon: RefreshCcw, label: "PEMBARUAN" },
    { path: "/chat", icon: MessageSquare, label: "CHAT", badge: unreadChats > 0 ? unreadChats : null },
    { path: "/upload", icon: Plus, label: "POSTING", isSpecial: true },
    { path: "/wallet", icon: Wallet, label: "EWALLET", badge: walletNotifications },
    { path: "/settings", icon: Settings, label: "PENGATURAN" },
  ];

  const navOptions = isAuthenticated ? authNavOptions : guestNavOptions;

  const handleOptionClick = (path: string) => {
    setLocation(path);
    setIsOpen(false);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-20 right-4 z-50">
      {/* Menu Options */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-2 animate-in slide-in-from-bottom-5 fade-in-0 duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {navOptions.map((option, index) => {
              const Icon = option.icon;
              const isSpecial = option.isSpecial;
              const hasNotificationBadge = option.badge && (typeof option.badge === 'number' ? option.badge > 0 : option.badge);
              
              return (
                <Button
                  key={option.path}
                  onClick={() => handleOptionClick(option.path)}
                  variant="ghost"
                  className={`w-full flex items-center justify-start px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${
                    isSpecial ? "bg-black text-white hover:bg-gray-900 dark:bg-gray-900 dark:hover:bg-gray-800" : "text-gray-700 dark:text-gray-200"
                  } ${index !== navOptions.length - 1 ? "border-b border-gray-100 dark:border-gray-600" : ""}`}
                  data-testid={`toggle-${option.label.toLowerCase().replace(/\s/g, '-')}`}
                >
                  <div className="relative">
                    <Icon className={`h-5 w-5 mr-4 ${isSpecial ? "text-white" : "text-gray-600 dark:text-gray-300"}`} />
                    
                    {/* Notification badge */}
                    {hasNotificationBadge && (
                      <div className="absolute -top-1 -right-1 flex items-center justify-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        {/* Show count for chat notifications */}
                        {option.label === "CHAT" && typeof option.badge === 'number' && option.badge > 0 && (
                          <div className="absolute -top-1 -right-1 min-w-[14px] h-[14px] bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                            {option.badge > 9 ? '9+' : option.badge}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <span className={`font-medium text-sm ${isSpecial ? "text-white" : ""}`}>
                    {option.label}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <Button
        onClick={toggleMenu}
        className={`h-12 w-12 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 shadow-lg hover:scale-105 transition-all duration-200 ${
          isOpen ? "rotate-45" : ""
        }`}
        variant="ghost"
        data-testid="button-chat-nav-toggle"
      >
        <div className="w-6 h-6 bg-black dark:bg-white rounded-full" />
      </Button>
    </div>
  );
}