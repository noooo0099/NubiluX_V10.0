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
      // Implement search functionality
      console.log("Searching for:", searchQuery);
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
          <div className="flex items-center space-x-1 min-w-0">
            {/* Search Section */}
            <div className="flex items-center">
              {/* Search Input Container - optimized for smooth animation */}
              <div 
                className={`overflow-hidden transform transition-all duration-200 ease-out will-change-transform ${
                  searchExpanded ? 'w-32 sm:w-48 opacity-100 mr-2' : 'w-0 opacity-0'
                }`}
              >
                <form onSubmit={handleSearch}>
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-nxe-surface rounded-full px-4 py-2 text-sm text-white placeholder-gray-400 border border-nxe-primary/30 focus:border-nxe-primary"
                    data-testid="input-search"
                  />
                </form>
              </div>
              
              {/* Search Toggle Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSearch}
                className="p-2 hover:bg-transparent shrink-0"
                data-testid="button-search-toggle"
              >
                {searchExpanded ? (
                  <X className="h-5 w-5 text-gray-300 transition-transform duration-200" />
                ) : (
                  <Search className="h-5 w-5 text-gray-300 hover:scale-110 transition-transform duration-200" />
                )}
              </Button>
            </div>

              {/* Actions (Notifications + Menu) */}
              <div className="flex items-center space-x-1">
                {isAuthenticated ? (
                  <>
                    {/* Notifications */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onShowNotifications}
                      className={`relative p-2 hover:bg-transparent shrink-0 transition-all duration-300 ${
                        searchExpanded ? "scale-90" : "scale-100"
                      }`}
                      data-testid="button-notifications"
                    >
                      <Bell className="h-5 w-5 text-gray-300" />
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs"
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
                          className={`p-2 hover:bg-transparent shrink-0 transition-all duration-300 ${
                            searchExpanded ? "scale-90" : "scale-100"
                          }`}
                          data-testid="button-menu"
                        >
                          <MoreVertical className="h-5 w-5 text-gray-300" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 bg-nxe-surface border border-nxe-primary/20">
                        <DropdownMenuItem onClick={() => setLocation("/profile")} className="cursor-pointer">
                          <span>Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLocation("/settings")} className="cursor-pointer">
                          <span>Pengaturan</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLocation("/chat")} className="cursor-pointer">
                          <span>Chat</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-nxe-primary/20" />
                        <DropdownMenuItem className="cursor-pointer">
                          <span>Bantuan</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-nxe-primary/20" />
                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400 focus:text-red-400">
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
                      className={`relative p-2 hover:bg-transparent shrink-0 transition-all duration-300 opacity-50 ${
                        searchExpanded ? "scale-90" : "scale-100"
                      }`}
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
                          className={`p-2 hover:bg-transparent shrink-0 transition-all duration-300 ${
                            searchExpanded ? "scale-90" : "scale-100"
                          }`}
                          data-testid="button-menu-guest"
                        >
                          <MoreVertical className="h-5 w-5 text-gray-300" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 bg-nxe-surface border border-nxe-primary/20">
                        <DropdownMenuItem onClick={() => setLocation("/auth")} className="cursor-pointer">
                          <span>Masuk</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-nxe-primary/20" />
                        <DropdownMenuItem className="cursor-pointer">
                          <span>Bantuan</span>
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
