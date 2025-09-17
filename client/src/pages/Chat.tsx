import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { Send, ArrowLeft, Phone, Video, MoreVertical, Paperclip, Smile, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";

interface ChatMessage {
  id: number;
  chatId: number;
  senderId: number;
  content: string;
  messageType: 'text' | 'image' | 'system' | 'ai_admin';
  metadata?: Record<string, any>;
  status?: 'sent' | 'delivered' | 'read';
  createdAt: string;
}

interface ChatDetails {
  id: number;
  productId?: number;
  buyerId: number;
  sellerId: number;
  status: string;
  productTitle?: string;
  productThumbnail?: string;
  productPrice?: string;
  productCategory?: string;
  otherUser?: {
    username: string;
    displayName?: string;
    profilePicture?: string;
    isVerified: boolean;
  };
  isCurrentUserBuyer: boolean;
  escrowTransaction?: any;
}

export default function Chat() {
  const { id: chatId } = useParams();
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // WebSocket connection for real-time messaging
  const { isConnected, sendMessage: sendWSMessage } = useWebSocket(user?.id || null, {
    onMessage: (wsMessage) => {
      if (wsMessage.type === 'new_message' && wsMessage.message?.chatId === parseInt(chatId || '0')) {
        // Invalidate messages query to fetch new message
        queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`] });
      }
    }
  });

  // Fetch chat details
  const { data: chatDetails, isLoading: chatLoading } = useQuery<ChatDetails>({
    queryKey: [`/api/chats/${chatId}`],
    enabled: !!chatId,
  });

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: [`/api/chats/${chatId}/messages`],
    enabled: !!chatId,
    refetchInterval: 5000, // Refresh every 5 seconds as fallback
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, messageType = 'text' }: { content: string; messageType?: string }) => {
      return apiRequest(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content, messageType })
      });
    },
    onSuccess: (newMessage) => {
      // Optimistically update the messages list
      queryClient.setQueryData([`/api/chats/${chatId}/messages`], (old: ChatMessage[] = []) => [
        ...old,
        newMessage
      ]);
      
      // Send via WebSocket for real-time delivery
      if (isConnected && chatDetails) {
        sendWSMessage({
          type: 'chat_message',
          chatId: parseInt(chatId || '0'),
          senderId: user?.id || 0,
          content: newMessage.content
        });
      }
      
      // Invalidate chat list to update last message
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessageMutation.isPending) return;

    const messageContent = message.trim();
    setMessage("");
    sendMessageMutation.mutate({ content: messageContent });
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle typing indicator
  useEffect(() => {
    if (message.trim() && !isTyping) {
      setIsTyping(true);
      // Send typing indicator via WebSocket
      if (isConnected && chatDetails) {
        sendWSMessage({
          type: 'user_typing',
          chatId: parseInt(chatId || '0'),
          userId: user?.id || 0
        });
      }
    } else if (!message.trim() && isTyping) {
      setIsTyping(false);
    }
  }, [message, isTyping, isConnected, chatDetails, sendWSMessage, user?.id, chatId]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(parseInt(amount));
  };

  if (chatLoading || !chatDetails) {
    return (
      <div className="min-h-screen bg-nxe-dark flex items-center justify-center">
        <div className="text-white">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nxe-dark flex flex-col">
      {/* Chat Header */}
      <div className="sticky top-0 z-50 bg-nxe-surface border-b border-nxe-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/chat")}
              className="p-2 text-white hover:bg-nxe-card"
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage 
                  src={chatDetails.otherUser?.profilePicture || `https://images.unsplash.com/photo-${1500 + (chatDetails.otherUser?.username?.length || 0)}?w=40&h=40&fit=crop&crop=face`}
                  alt={chatDetails.otherUser?.username}
                />
                <AvatarFallback>
                  {chatDetails.otherUser?.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h2 className="text-white font-medium text-sm">
                  {chatDetails.otherUser?.displayName || chatDetails.otherUser?.username || 'User'}
                </h2>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">
                    {isConnected ? 'Online' : 'Offline'}
                  </span>
                  {chatDetails.otherUser?.isVerified && (
                    <Badge className="bg-blue-600 text-white text-xs px-1 py-0">✓</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="p-2 text-white hover:bg-nxe-card">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2 text-white hover:bg-nxe-card">
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2 text-white hover:bg-nxe-card">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Product Info Banner */}
        {chatDetails.productTitle && (
          <div className="px-4 py-2 bg-nxe-card border-t border-nxe-border">
            <div className="flex items-center space-x-3">
              <img 
                src={chatDetails.productThumbnail || '/api/placeholder/60/60'}
                alt={chatDetails.productTitle}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium text-sm truncate">
                  {chatDetails.productTitle}
                </h3>
                <p className="text-nxe-primary font-bold text-sm">
                  {chatDetails.productPrice ? formatCurrency(chatDetails.productPrice) : 'Price not set'}
                </p>
              </div>
              <Button
                onClick={() => setLocation(`/product/${chatDetails.productId}`)}
                variant="outline"
                size="sm"
                className="border-nxe-primary text-nxe-primary hover:bg-nxe-primary hover:text-white"
              >
                View
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messagesLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="text-gray-400">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">No messages yet</div>
            <div className="text-sm text-gray-500">Start the conversation!</div>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.senderId === user?.id;
            const isAIAdmin = msg.messageType === 'ai_admin';
            
            return (
              <div
                key={msg.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${isAIAdmin ? 'justify-center' : ''}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  isAIAdmin 
                    ? 'bg-yellow-600/20 border border-yellow-600/30 text-yellow-100'
                    : isOwnMessage 
                    ? 'bg-nxe-primary text-white' 
                    : 'bg-nxe-card text-white'
                }`}>
                  {isAIAdmin && (
                    <div className="text-xs text-yellow-300 mb-1 font-medium">🤖 AI Admin</div>
                  )}
                  <p className="text-sm">{msg.content}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs opacity-70">
                      {formatTime(msg.createdAt)}
                    </span>
                    {isOwnMessage && msg.status && (
                      <span className="text-xs opacity-70">
                        {msg.status === 'read' ? '✓✓' : msg.status === 'delivered' ? '✓' : '○'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="sticky bottom-0 bg-nxe-surface border-t border-nxe-border p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="p-2 text-gray-400 hover:text-white hover:bg-nxe-card"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="bg-nxe-card border-nxe-border text-white pr-10"
              data-testid="input-message"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-white"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>
          
          {message.trim() ? (
            <Button
              type="submit"
              disabled={sendMessageMutation.isPending}
              className="bg-nxe-primary hover:bg-nxe-primary/80 p-2"
              data-testid="button-send"
            >
              <Send className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="p-2 text-gray-400 hover:text-white hover:bg-nxe-card"
            >
              <Mic className="h-5 w-5" />
            </Button>
          )}
        </form>
        
        {/* Connection Status */}
        {!isConnected && (
          <div className="text-center mt-2">
            <span className="text-xs text-yellow-400">Reconnecting...</span>
          </div>
        )}
      </div>
    </div>
  );
}