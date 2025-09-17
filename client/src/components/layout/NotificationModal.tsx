import { X, ShoppingCart, MessageCircle, AlertTriangle, Bell, Sparkles, Zap, Gift } from "lucide-react";
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
      {/* Enhanced backdrop with glassmorphism */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-all duration-300"
        onClick={onClose}
      >
        {/* Animated background patterns */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-32 h-32 bg-nxe-primary/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-40 right-32 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl animate-bounce" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-10 w-16 h-16 bg-nxe-accent/20 rounded-full blur-xl animate-ping" style={{ animationDelay: '2s' }} />
        </div>
      </div>
      
      {/* Enhanced modal with glassmorphism */}
      <div className="relative w-80 h-full bg-gradient-to-b from-nxe-surface/95 to-nxe-dark/95 backdrop-blur-xl transform transition-all duration-500 ease-out shadow-2xl border-l border-white/10 animate-in slide-in-from-right">
        {/* Enhanced header with gradient */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-nxe-primary/20 via-purple-600/10 to-nxe-accent/20 relative overflow-hidden">
          {/* Header background effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          <div className="absolute -top-2 -right-2 w-20 h-20 bg-nxe-primary/10 rounded-full blur-2xl" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Bell className="h-6 w-6 text-nxe-primary" />
                <div className="absolute inset-0 bg-nxe-primary/20 rounded-full blur-sm animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white drop-shadow-lg">Notifications</h3>
                <p className="text-gray-300 text-xs">Stay updated with your activity</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2.5 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm text-gray-300 hover:text-white transition-all duration-300 border border-white/10 hover:border-white/20 hover:scale-110"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Enhanced content area */}
        <div className="p-6 space-y-4 overflow-y-auto h-full pb-20 custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative mx-auto w-20 h-20 mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-nxe-primary/20 to-purple-600/20 rounded-full animate-pulse" />
                <Bell className="h-20 w-20 mx-auto text-nxe-primary/60 relative z-10" />
                <div className="absolute inset-0 bg-nxe-primary/10 rounded-full blur-xl" />
                <div className="absolute top-2 right-2 w-3 h-3 bg-nxe-accent rounded-full animate-ping" />
              </div>
              <p className="text-gray-300 text-lg font-medium mb-2">All caught up!</p>
              <p className="text-gray-500 text-sm">You'll see new notifications here</p>
            </div>
          ) : (
            notifications.map((notification: any, index: number) => (
              <Card 
                key={notification.id} 
                className="bg-gradient-to-r from-nxe-card/80 to-nxe-surface/60 border border-white/10 hover:from-nxe-card hover:to-nxe-surface/80 transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm cursor-pointer hover:scale-[1.02] group animate-in slide-in-from-right"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-4 relative overflow-hidden">
                  {/* Card gradient overlay */}
                  <div className={`absolute left-0 top-0 w-1 h-full bg-gradient-to-b ${notification.type === 'order' ? 'from-nxe-primary to-green-600' : notification.type === 'message' ? 'from-blue-500 to-purple-600' : 'from-yellow-500 to-orange-600'}`} />
                  
                  <div className="flex items-start space-x-3 relative z-10">
                    <div className="relative">
                      <div className={`p-2 rounded-xl ${notification.type === 'order' ? 'bg-gradient-to-br from-nxe-primary/20 to-green-600/20' : notification.type === 'message' ? 'bg-gradient-to-br from-blue-500/20 to-purple-600/20' : 'bg-gradient-to-br from-yellow-500/20 to-orange-600/20'} backdrop-blur-sm border border-white/10`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className={`absolute inset-0 ${notification.type === 'order' ? 'bg-nxe-primary/10' : notification.type === 'message' ? 'bg-blue-500/10' : 'bg-yellow-500/10'} rounded-xl blur-lg group-hover:blur-xl transition-all duration-300`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold mb-1 group-hover:text-nxe-primary transition-colors">
                        {notification.title}
                      </p>
                      <p className="text-gray-300 text-xs line-clamp-2 leading-relaxed mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs bg-black/20 px-2 py-1 rounded-full">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </span>
                        <div className="w-2 h-2 bg-nxe-accent rounded-full animate-pulse" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {/* Enhanced sample notifications for demo - only show when no real notifications exist */}
          {notifications.length === 0 && (
            <>
              <Card className="bg-gradient-to-r from-nxe-card/80 to-nxe-surface/60 border border-white/10 hover:from-nxe-card hover:to-nxe-surface/80 transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm cursor-pointer hover:scale-[1.02] group animate-in slide-in-from-right" style={{ animationDelay: '200ms' }}>
                <CardContent className="p-4 relative overflow-hidden">
                  <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-nxe-primary to-green-600" />
                  <div className="flex items-start space-x-3 relative z-10">
                    <div className="relative">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-nxe-primary/20 to-green-600/20 backdrop-blur-sm border border-white/10">
                        <ShoppingCart className="h-4 w-4 text-nxe-primary" />
                      </div>
                      <div className="absolute inset-0 bg-nxe-primary/10 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-semibold mb-1 group-hover:text-nxe-primary transition-colors">New Order Received</p>
                      <p className="text-gray-300 text-xs leading-relaxed mb-2">You have a new order for Mobile Legends account</p>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs bg-black/20 px-2 py-1 rounded-full">2 minutes ago</span>
                        <div className="w-2 h-2 bg-nxe-accent rounded-full animate-pulse" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-nxe-card/80 to-nxe-surface/60 border border-white/10 hover:from-nxe-card hover:to-nxe-surface/80 transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm cursor-pointer hover:scale-[1.02] group animate-in slide-in-from-right" style={{ animationDelay: '300ms' }}>
                <CardContent className="p-4 relative overflow-hidden">
                  <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-600" />
                  <div className="flex items-start space-x-3 relative z-10">
                    <div className="relative">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-sm border border-white/10">
                        <MessageCircle className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="absolute inset-0 bg-blue-500/10 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-semibold mb-1 group-hover:text-blue-400 transition-colors">New Message</p>
                      <p className="text-gray-300 text-xs leading-relaxed mb-2">Buyer is asking about the account details</p>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs bg-black/20 px-2 py-1 rounded-full">5 minutes ago</span>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-nxe-card/80 to-nxe-surface/60 border border-white/10 hover:from-nxe-card hover:to-nxe-surface/80 transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm cursor-pointer hover:scale-[1.02] group animate-in slide-in-from-right" style={{ animationDelay: '400ms' }}>
                <CardContent className="p-4 relative overflow-hidden">
                  <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-yellow-500 to-orange-600" />
                  <div className="flex items-start space-x-3 relative z-10">
                    <div className="relative">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-600/20 backdrop-blur-sm border border-white/10">
                        <AlertTriangle className="h-4 w-4 text-yellow-400" />
                      </div>
                      <div className="absolute inset-0 bg-yellow-500/10 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-semibold mb-1 group-hover:text-yellow-400 transition-colors">Payment Pending</p>
                      <p className="text-gray-300 text-xs leading-relaxed mb-2">Waiting for QRIS payment confirmation</p>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs bg-black/20 px-2 py-1 rounded-full">10 minutes ago</span>
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
