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

          {/* WhatsApp-style expanding search bar */}
          <div className={`absolute right-0 transition-all duration-500 ease-out ${
            searchExpanded 
              ? 'inset-0 right-0' 
              : 'w-10 h-10'
          }`}>
            {searchExpanded ? (
              // Expanded search bar
              <div className="h-full flex items-center justify-center px-4">
                <form onSubmit={handleSearch} className="relative w-full max-w-2xl">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Tanya AI atau Cari produk, kategori..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 bg-gray-700/90 rounded-full pl-12 pr-4 text-sm text-white placeholder-gray-400 border-0 focus:outline-none focus:bg-gray-600/90 focus:ring-2 focus:ring-nxe-primary focus:shadow-lg focus:shadow-nxe-primary/25 selection:bg-nxe-primary selection:text-white transition-all duration-300"
                    data-testid="input-search"
                    autoComplete="off"
                    spellCheck="false"
                    aria-label="Search"
                  />
                  <button
                    type="button"
                    onClick={toggleSearch}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-0 hover:scale-110 transition-all duration-300"
                    data-testid="button-search-back-icon"
                    aria-label="Back"
                  >
                    <ArrowLeft className="h-4 w-4 text-gray-400 hover:text-nxe-primary transition-colors duration-300" />
                  </button>
                </form>
              </div>
            ) : (
              // Search toggle button
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
            )}
          </div>

          {/* Right - Actions */}
          <div className={`flex items-center space-x-1 transition-all duration-500 ease-out ${
            searchExpanded ? 'transform translate-x-full opacity-0' : ''
          }`}>
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
                  <Bell className="h-5 w-5 text-gray-300 hover:text-white transition-colors duration-200" />
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs animate-pulse"
                  >
                    3
                  </Badge>
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
