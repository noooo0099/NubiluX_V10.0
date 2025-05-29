import { Home, Play, Plus, Wallet, Settings } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/video", icon: Play, label: "Video" },
    { path: "/upload", icon: Plus, label: "Upload", isSpecial: true },
    { path: "/wallet", icon: Wallet, label: "Wallet" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 nxe-glass border-t border-nxe-surface z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          if (item.isSpecial) {
            return (
              <Button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className="flex flex-col items-center p-1"
                variant="ghost"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-nxe-primary to-nxe-accent rounded-full flex items-center justify-center mb-1 hover:scale-110 transition-transform">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-gray-400">{item.label}</span>
              </Button>
            );
          }

          return (
            <Button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className="flex flex-col items-center p-2 transition-colors duration-200 hover:bg-transparent"
              variant="ghost"
            >
              <div className={`p-2 rounded-full transition-colors ${
                isActive ? "bg-nxe-primary text-white" : "text-gray-400 hover:text-white"
              }`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={`text-xs font-medium mt-1 ${
                isActive ? "text-nxe-primary" : "text-gray-400"
              }`}>{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
