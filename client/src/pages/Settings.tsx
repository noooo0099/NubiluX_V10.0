import { useState } from "react";
import { 
  User, Shield, Bell, Moon, Sun, LogOut, 
  CreditCard, HelpCircle, Star, ToggleLeft, ToggleRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [currentRole, setCurrentRole] = useState<"buyer" | "seller">("buyer");
  const [notifications, setNotifications] = useState({
    orders: true,
    messages: true,
    payments: false,
    marketing: false,
  });
  const [darkMode, setDarkMode] = useState(true);
  const { toast } = useToast();

  const handleRoleSwitch = () => {
    const newRole = currentRole === "buyer" ? "seller" : "buyer";
    setCurrentRole(newRole);
    toast({
      title: "Role switched successfully",
      description: `You are now a ${newRole}`,
    });
  };

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleLogout = () => {
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  const settingSections = [
    {
      title: "Account",
      items: [
        {
          icon: <User className="h-5 w-5" />,
          label: "Edit Profile",
          action: () => console.log("Edit profile"),
        },
        {
          icon: <Shield className="h-5 w-5" />,
          label: "Privacy & Security",
          action: () => console.log("Privacy settings"),
        },
        {
          icon: <CreditCard className="h-5 w-5" />,
          label: "Payment Methods",
          action: () => console.log("Payment methods"),
        },
      ]
    },
    {
      title: "App Settings",
      items: [
        {
          icon: <Bell className="h-5 w-5" />,
          label: "Notifications",
          action: () => console.log("Notification settings"),
        },
        {
          icon: darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />,
          label: "Dark Mode",
          toggle: true,
          value: darkMode,
          action: () => setDarkMode(!darkMode),
        },
      ]
    },
    {
      title: "Support",
      items: [
        {
          icon: <HelpCircle className="h-5 w-5" />,
          label: "Help Center",
          action: () => console.log("Help center"),
        },
        {
          icon: <Star className="h-5 w-5" />,
          label: "Rate App",
          action: () => console.log("Rate app"),
        },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-nxe-dark px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      {/* Role Switcher */}
      <Card className="bg-nxe-card border-nxe-surface mb-6">
        <CardHeader>
          <CardTitle className="text-white">User Role</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Current Role</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge 
                  variant={currentRole === "seller" ? "default" : "secondary"}
                  className={currentRole === "seller" ? "bg-nxe-primary" : ""}
                >
                  {currentRole === "seller" ? "Seller" : "Buyer"}
                </Badge>
                <span className="text-gray-400 text-sm">
                  {currentRole === "seller" 
                    ? "You can sell products" 
                    : "You can buy products"
                  }
                </span>
              </div>
            </div>
            <Button
              onClick={handleRoleSwitch}
              className="bg-nxe-accent hover:bg-nxe-accent/80"
            >
              Switch to {currentRole === "buyer" ? "Seller" : "Buyer"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="bg-nxe-card border-nxe-surface mb-6">
        <CardHeader>
          <CardTitle className="text-white">Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="orders" className="text-white">Order Updates</Label>
            <Switch
              id="orders"
              checked={notifications.orders}
              onCheckedChange={() => handleNotificationChange("orders")}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="messages" className="text-white">New Messages</Label>
            <Switch
              id="messages"
              checked={notifications.messages}
              onCheckedChange={() => handleNotificationChange("messages")}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="payments" className="text-white">Payment Alerts</Label>
            <Switch
              id="payments"
              checked={notifications.payments}
              onCheckedChange={() => handleNotificationChange("payments")}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="marketing" className="text-white">Marketing Updates</Label>
            <Switch
              id="marketing"
              checked={notifications.marketing}
              onCheckedChange={() => handleNotificationChange("marketing")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Settings Sections */}
      {settingSections.map((section) => (
        <Card key={section.title} className="bg-nxe-card border-nxe-surface mb-4">
          <CardHeader>
            <CardTitle className="text-white text-lg">{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {section.items.map((item, index) => (
              <Button
                key={index}
                onClick={item.action}
                variant="ghost"
                className="w-full justify-between p-3 h-auto hover:bg-nxe-surface"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-gray-400">{item.icon}</div>
                  <span className="text-white">{item.label}</span>
                </div>
                {item.toggle ? (
                  item.value ? (
                    <ToggleRight className="h-5 w-5 text-nxe-primary" />
                  ) : (
                    <ToggleLeft className="h-5 w-5 text-gray-400" />
                  )
                ) : (
                  <div className="w-2 h-2 rounded-full bg-gray-600" />
                )}
              </Button>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Logout */}
      <Card className="bg-red-900/20 border-red-700/30">
        <CardContent className="p-4">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-center text-red-400 hover:text-red-300 hover:bg-red-900/30"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
