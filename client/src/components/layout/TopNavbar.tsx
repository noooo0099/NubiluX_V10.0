import { useState } from "react";
import { Search, Bell, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

interface TopNavbarProps {
  onShowNotifications: () => void;
}

export default function TopNavbar({ onShowNotifications }: TopNavbarProps) {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

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
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <div 
          className={`flex items-center space-x-1 transition-transform duration-300 nxe-logo ${
            searchExpanded ? "scale-75" : "scale-100"
          }`}
        >
          <span className="text-xl font-bold text-white">Nubilu</span>
          <span className="text-xl font-bold text-nxe-primary mx-1">X</span>
          <span className="text-xl font-bold text-white">change</span>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-1">
          {/* Search */}
          <div className="relative flex items-center">
            {searchExpanded && (
              <form onSubmit={handleSearch} className="absolute right-12 top-1/2 transform -translate-y-1/2">
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-56 bg-nxe-surface rounded-full px-4 py-2 text-sm text-white placeholder-gray-400 border border-nxe-primary/30 focus:border-nxe-primary"
                  autoFocus
                />
              </form>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSearch}
              className="p-2 hover:bg-transparent"
            >
              {searchExpanded ? (
                <X className="h-5 w-5 text-gray-300" />
              ) : (
                <Search className="h-5 w-5 text-gray-300" />
              )}
            </Button>
          </div>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowNotifications}
            className="relative p-2 hover:bg-transparent"
          >
            <Bell className="h-5 w-5 text-gray-300" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs"
            >
              3
            </Badge>
          </Button>

          {/* Chat */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/chat")}
            className="p-2 hover:bg-transparent"
          >
            <MessageCircle className="h-5 w-5 text-gray-300" />
          </Button>

          {/* Profile */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/profile/1")}
            className="p-0 hover:bg-transparent"
          >
            <Avatar className="w-8 h-8 border-2 border-nxe-primary">
              <AvatarImage 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100" 
                alt="Profile" 
              />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </Button>
        </div>
      </div>
    </header>
  );
}
