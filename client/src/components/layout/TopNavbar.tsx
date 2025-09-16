import { useState, useRef, useEffect } from "react";
import { Search, Bell, MessageCircle, X, LogIn, User, MoreVertical, Settings, LogOut, UserCircle, HelpCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

interface TopNavbarProps {
  onShowNotifications: () => void;
}

export default function TopNavbar({ onShowNotifications }: TopNavbarProps) {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const toggleSearch = () => {
    setSearchExpanded(!searchExpanded);
    if (searchExpanded) {
      setSearchQuery("");
    }
  };

  // Focus input when search expands
  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchExpanded]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results page with query
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchExpanded(false);
      setSearchQuery("");
    }
  };

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <header className="sticky top-0 z-50 nxe-glass border-b border-nxe-surface">
      <div className="h-14 px-4 relative overflow-hidden">
        <div className="h-full flex items-center justify-between relative">
          {/* Left - Logo */}
          <div className={`flex items-center justify-start min-w-0 transition-all duration-500 ease-out ${
            searchExpanded ? 'transform -translate-x-full opacity-0' : ''
          }`}>
            <div className="flex items-center space-x-1 nxe-logo">
              <span className="font-bold text-lg text-white">
                Nubilu
              </span>
              <span className="font-bold text-lg text-nxe-primary mx-1">
                X
              </span>
              <span className="font-bold text-lg text-white">
                change
              </span>
            </div>
          </div>

          {/* Expanded search bar overlay */}
          {searchExpanded && (
            <div className="absolute inset-0 h-full flex items-center justify-center px-4 z-10">
              <form onSubmit={handleSearch} className="relative w-full max-w-2xl">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Tanya AI atau Cari produk, kategori..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 bg-gray-700/90 rounded-full pl-14 pr-4 text-sm text-white placeholder-gray-400 border-0 focus:outline-none focus:bg-gray-600/90 focus:ring-2 focus:ring-nxe-primary focus:shadow-lg focus:shadow-nxe-primary/25 selection:bg-nxe-primary selection:text-white transition-all duration-300"
                  data-testid="input-search"
                  autoComplete="off"
                  spellCheck="false"
                  aria-label="Search"
                />
                <button
                  type="button"
                  onClick={toggleSearch}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full hover:bg-gray-600/50 hover:scale-105 transition-all duration-300 min-w-[40px] min-h-[40px] flex items-center justify-center"
                  data-testid="button-search-back-icon"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-400 hover:text-nxe-primary transition-colors duration-300" />
                </button>
              </form>
            </div>
          )}

          {/* Right - Actions */}
          <div className={`flex items-center space-x-1 transition-all duration-500 ease-out ${
            searchExpanded ? 'transform translate-x-full opacity-0' : ''
          }`}>
            {/* Search Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSearch}
              className="p-2 hover:bg-transparent shrink-0 transition-all duration-300 hover:scale-110 hover:rotate-12"
              data-testid="button-search-toggle"
              aria-label="Search"
            >
              <Search className="h-5 w-5 text-gray-300 hover:text-nxe-primary hover:scale-125 transition-all duration-300" />
            </Button>
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onShowNotifications}
                  className="relative p-2 hover:bg-transparent hover:scale-105 shrink-0 transition-all duration-200 ease-in-out"
                  data-testid="button-notifications"
                >
                  <div className="relative">
                    <Bell className="h-5 w-5 text-gray-300 hover:text-white transition-colors duration-200" />
                    
                    {/* Green notification indicator with new design */}
                    <div className="absolute -bottom-1 -right-1 flex items-center justify-center">
                      <div className="relative">
                        {/* Pulsing green dot */}
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg" />
                        {/* Subtle ripple effect */}
                        <div className="absolute inset-0 w-3 h-3 bg-green-500/30 rounded-full animate-ping" />
                        {/* Notification count */}
                        <div className="absolute -top-1 -right-1 min-w-[14px] h-[14px] bg-green-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-nxe-surface">
                          3
                        </div>
                      </div>
                    </div>
                  </div>
                </Button>

                {/* 3 Dots Menu (WhatsApp Style) */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 hover:bg-transparent hover:scale-105 shrink-0 transition-all duration-200 ease-in-out"
                      data-testid="button-menu"
                    >
                      <MoreVertical className="h-5 w-5 text-gray-300 hover:text-white transition-colors duration-200" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 bg-nxe-surface border border-gray-600 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
                    <DropdownMenuItem onClick={() => setLocation("/profile")} className="cursor-pointer hover:bg-gray-700 transition-colors duration-150">
                      <span className="text-white">Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/settings")} className="cursor-pointer hover:bg-gray-700 transition-colors duration-150">
                      <span className="text-white">Pengaturan</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/chat")} className="cursor-pointer hover:bg-gray-700 transition-colors duration-150">
                      <span className="text-white">Chat</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-600" />
                    <DropdownMenuItem className="cursor-pointer hover:bg-gray-700 transition-colors duration-150">
                      <span className="text-white">Bantuan</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-600" />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400 focus:text-red-400 hover:bg-red-400/10 transition-colors duration-150">
                      <span>Keluar</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {/* Guest Mode - Only essential actions */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onShowNotifications}
                  className="relative p-2 hover:bg-transparent shrink-0 transition-all duration-200 ease-in-out opacity-50"
                  disabled
                  data-testid="button-notifications-guest"
                >
                  <Bell className="h-5 w-5 text-gray-300" />
                </Button>

                {/* Guest 3 Dots Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 hover:bg-transparent hover:scale-105 shrink-0 transition-all duration-200 ease-in-out"
                      data-testid="button-menu-guest"
                    >
                      <MoreVertical className="h-5 w-5 text-gray-300 hover:text-white transition-colors duration-200" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 bg-nxe-surface border border-gray-600 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
                    <DropdownMenuItem onClick={() => setLocation("/auth")} className="cursor-pointer hover:bg-gray-700 transition-colors duration-150">
                      <span className="text-white">Masuk</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-600" />
                    <DropdownMenuItem className="cursor-pointer hover:bg-gray-700 transition-colors duration-150">
                      <span className="text-white">Bantuan</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
