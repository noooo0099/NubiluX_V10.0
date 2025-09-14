import { useState, useRef, useEffect } from "react";
import { Search, Bell, MessageCircle, X, LogIn, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

interface TopNavbarProps {
  onShowNotifications: () => void;
}

export default function TopNavbar({ onShowNotifications }: TopNavbarProps) {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
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

  return (
    <header className="sticky top-0 z-50 nxe-glass border-b border-nxe-surface">
      <div className="h-14 px-4">
        {/* 3-column grid layout that truly pushes elements */}
        <div 
          className="h-full grid items-center transition-all duration-300 ease-out"
          style={{
            gridTemplateColumns: searchExpanded 
              ? "1fr max-content 1fr"  // When expanded: logo | search | actions
              : "1fr auto 1fr"         // When collapsed: logo | search-button | actions
          }}
        >
          {/* Left Column - Logo */}
          <div className="flex items-center justify-start min-w-0">
            <div 
              className={`flex items-center space-x-1 nxe-logo transition-all duration-300 ease-out ${
                searchExpanded ? "scale-90" : "scale-100"
              }`}
            >
              <span className={`font-bold text-white transition-all duration-300 ${
                searchExpanded ? "text-base" : "text-lg"
              }`}>
                Nubilu
              </span>
              <span className={`font-bold text-nxe-primary mx-1 transition-all duration-300 ${
                searchExpanded ? "text-base" : "text-lg"
              }`}>
                X
              </span>
              <span className={`font-bold text-white transition-all duration-300 ${
                searchExpanded ? "text-base sm:inline hidden" : "text-lg"
              }`}>
                change
              </span>
            </div>
          </div>

          {/* Center Column - Search */}
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              {/* Search Input Container - always mounted for smooth animation */}
              <div 
                className={`overflow-hidden transition-all duration-300 ease-out ${
                  searchExpanded ? 'w-32 sm:w-52 opacity-100' : 'w-0 opacity-0'
                }`}
              >
                <form onSubmit={handleSearch} className="mr-2">
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
          </div>

          {/* Right Column - Actions */}
          <div className="flex items-center justify-end space-x-1 min-w-0">
            {isAuthenticated ? (
              <>
                {/* Notifications - Authenticated Only */}
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

                {/* Chat - Hidden on small screens when search expanded */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/chat")}
                  className={`p-2 hover:bg-transparent shrink-0 transition-all duration-300 ${
                    searchExpanded ? "scale-90 hidden sm:inline-flex" : "scale-100"
                  }`}
                  data-testid="button-chat"
                >
                  <MessageCircle className="h-5 w-5 text-gray-300" />
                </Button>

                {/* Profile - Authenticated Only */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/profile")}
                  className={`p-0 hover:bg-transparent shrink-0 transition-all duration-300 ${
                    searchExpanded ? "scale-90" : "scale-100"
                  }`}
                  data-testid="button-profile"
                >
                  <Avatar className="w-8 h-8 border-2 border-nxe-primary">
                    <AvatarImage 
                      src={user?.profilePicture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"} 
                      alt={user?.displayName || user?.username || "Profile"} 
                    />
                    <AvatarFallback>
                      {user?.displayName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </>
            ) : (
              /* Guest Mode - Login Button */
              <Button
                variant="default"
                size="sm"
                onClick={() => setLocation("/auth")}
                className={`bg-nxe-primary hover:bg-nxe-primary/80 text-white px-3 shrink-0 transition-all duration-300 ${
                  searchExpanded ? "scale-90" : "scale-100"
                }`}
                data-testid="button-login"
              >
                <LogIn className="h-4 w-4 mr-1" />
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
