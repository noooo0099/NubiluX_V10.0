import { X, ShoppingCart, MessageCircle, AlertTriangle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    enabled: isOpen,
  });

  if (!isOpen) return null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order":
        return <ShoppingCart className="h-4 w-4 text-nxe-primary" />;
      case "message":
        return <MessageCircle className="h-4 w-4 text-nxe-accent" />;
      case "payment":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <ShoppingCart className="h-4 w-4 text-nxe-primary" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case "order":
        return "border-l-nxe-primary";
      case "message":
        return "border-l-nxe-accent";
      case "payment":
        return "border-l-yellow-500";
      default:
        return "border-l-nxe-primary";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-80 h-full bg-nxe-surface transform transition-transform duration-300 ease-out shadow-2xl border-l border-nxe-border">
        {/* Header */}
        <div className="p-6 border-b border-nxe-card bg-gradient-to-r from-nxe-surface to-nxe-card/50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Notifications</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-nxe-card/70 text-gray-400 hover:text-white transition-all duration-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto h-full pb-20">
          {notifications.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification: any) => (
              <Card 
                key={notification.id} 
                className={`bg-nxe-card border-l-4 ${getBorderColor(notification.type)} border-t-0 border-r-0 border-b-0 hover:bg-nxe-card/80 transition-all duration-200 shadow-sm hover:shadow-md`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">
                        {notification.title}
                      </p>
                      <p className="text-gray-400 text-xs mt-2 line-clamp-2 leading-relaxed">
                        {notification.message}
                      </p>
                      <span className="text-gray-500 text-xs mt-2 block">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          
          {/* Sample notifications for demo */}
          <Card className="bg-nxe-card border-l-4 border-l-nxe-primary border-t-0 border-r-0 border-b-0 hover:bg-nxe-card/80 transition-all duration-200 shadow-sm hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <ShoppingCart className="h-4 w-4 text-nxe-primary mt-1" />
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">New Order Received</p>
                  <p className="text-gray-400 text-xs mt-2 leading-relaxed">You have a new order for Mobile Legends account</p>
                  <span className="text-gray-500 text-xs mt-2 block">2 minutes ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-nxe-card border-l-4 border-l-nxe-accent border-t-0 border-r-0 border-b-0 hover:bg-nxe-card/80 transition-all duration-200 shadow-sm hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <MessageCircle className="h-4 w-4 text-nxe-accent mt-1" />
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">New Message</p>
                  <p className="text-gray-400 text-xs mt-2 leading-relaxed">Buyer is asking about the account details</p>
                  <span className="text-gray-500 text-xs mt-2 block">5 minutes ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-nxe-card border-l-4 border-l-yellow-500 border-t-0 border-r-0 border-b-0 hover:bg-nxe-card/80 transition-all duration-200 shadow-sm hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-1" />
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">Payment Pending</p>
                  <p className="text-gray-400 text-xs mt-2 leading-relaxed">Waiting for QRIS payment confirmation</p>
                  <span className="text-gray-500 text-xs mt-2 block">10 minutes ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
