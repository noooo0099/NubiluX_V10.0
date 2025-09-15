import { useState, useRef, useEffect } from "react";
import { Search, Bell, MessageCircle, X, LogIn, User, MoreVertical, Settings, LogOut, UserCircle, HelpCircle } from "lucide-react";
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
      <div className="h-14 px-4">
        {/* 2-column layout optimized for mobile */}
        <div className="h-full flex items-center justify-between">
          {/* Left - Logo */}
          <div className="flex items-center justify-start min-w-0">
            <div className="flex items-center space-x-1 nxe-logo">
              <span className="font-bold text-lg text-white">
                Nubilu
              </span>
              <span className="font-bold text-lg text-nxe-primary mx-1">
                X
              </span>
              <span className={`font-bold text-lg text-white ${
                searchExpanded ? "sm:inline hidden" : ""
              }`}>
                change
              </span>
            </div>
          </div>

          {/* Right - Search + Actions grouped together */}
          <div className="flex items-center min-w-0">
            {/* Search Section - Fixed animation to push elements */}
            <div className="flex items-center transition-all duration-300 ease-out">
              {/* Search Input Container - smooth expansion that pushes elements */}
              <div 
                className={`overflow-hidden transition-all duration-300 ease-out ${
                  searchExpanded ? 'w-32 sm:w-48 opacity-100 mr-2' : 'w-0 opacity-0 mr-0'
                }`}
              >
                <form onSubmit={handleSearch} className="h-full flex items-center">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Cari produk, kategori..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-8 bg-nxe-surface rounded-full px-4 text-sm text-white placeholder-gray-400 border-0 focus:outline-none focus:bg-nxe-surface focus:ring-2 focus:ring-nxe-primary/20 transition-all duration-200"
                    data-testid="input-search"
                    autoComplete="off"
                    spellCheck="false"
                  />
                </form>
              </div>
              
              {/* Search Toggle Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSearch}
                className="p-2 hover:bg-transparent shrink-0 transition-all duration-200"
                data-testid="button-search-toggle"
              >
                {searchExpanded ? (
                  <X className="h-5 w-5 text-gray-300 hover:text-white transition-all duration-200" />
                ) : (
                  <Search className="h-5 w-5 text-gray-300 hover:text-white hover:scale-110 transition-all duration-200" />
                )}
              </Button>
            </div>

              {/* Actions (Notifications + Menu) - Now properly pushed by search animation */}
              <div className="flex items-center space-x-1 ml-1">
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
      </div>
    </header>
  );
}
