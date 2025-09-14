import { useState } from "react";
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

  const toggleSearch = () => {
    setSearchExpanded(!searchExpanded);
    if (searchExpanded) {
      setSearchQuery("");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality
      console.log("Searching for:", searchQuery);
    }
  };

  return (
    <header className="sticky top-0 z-50 nxe-glass border-b border-nxe-surface">
      <div className="relative px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left Side - Logo */}
          <div 
            className={`flex items-center space-x-1 nxe-logo transition-all duration-300 ease-in-out ${
              searchExpanded ? "transform -translate-x-2 scale-90 opacity-75" : "transform translate-x-0 scale-100 opacity-100"
            }`}
          >
            <span className="text-lg font-bold text-white">Nubilu</span>
            <span className="text-lg font-bold text-nxe-primary mx-1">X</span>
            <span className="text-lg font-bold text-white">change</span>
          </div>

          {/* Center - Search (positioned absolutely to expand from center) */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="relative flex items-center">
              {/* Search Input - expands from center */}
              <div 
                className={`overflow-hidden transition-all duration-400 ease-out ${
                  searchExpanded 
                    ? 'w-64 opacity-100 scale-100' 
                    : 'w-0 opacity-0 scale-95'
                }`}
              >
                <form onSubmit={handleSearch}>
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-nxe-surface rounded-full px-4 py-2 text-sm text-white placeholder-gray-400 border border-nxe-primary/30 focus:border-nxe-primary"
                    autoFocus
                    data-testid="input-search"
                  />
                </form>
              </div>
              
              {/* Search Toggle Button - stays in center */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSearch}
                className={`p-2 hover:bg-transparent transition-all duration-300 ${
                  searchExpanded ? 'ml-2' : 'ml-0'
                }`}
                data-testid="button-search-toggle"
              >
                {searchExpanded ? (
                  <X className="h-5 w-5 text-gray-300" />
                ) : (
                  <Search className="h-5 w-5 text-gray-300 hover:scale-110 transition-transform" />
                )}
              </Button>
            </div>
          </div>

          {/* Right Side - Actions */}
          <div 
            className={`flex items-center space-x-1 transition-all duration-300 ease-in-out ${
              searchExpanded ? "transform translate-x-2 scale-90 opacity-75" : "transform translate-x-0 scale-100 opacity-100"
            }`}
          >
            {isAuthenticated ? (
              <>
                {/* Notifications - Authenticated Only */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onShowNotifications}
                  className="relative p-2 hover:bg-transparent"
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

                {/* Chat - Authenticated Only */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/chat")}
                  className="p-2 hover:bg-transparent"
                  data-testid="button-chat"
                >
                  <MessageCircle className="h-5 w-5 text-gray-300" />
                </Button>

                {/* Profile - Authenticated Only */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/profile")}
                  className="p-0 hover:bg-transparent"
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
                className="bg-nxe-primary hover:bg-nxe-primary/80 text-white px-3"
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
