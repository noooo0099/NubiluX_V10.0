import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { Send, Phone, Video, MoreVertical, ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/useWebSocket";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

interface ChatListItem {
  id: number;
  productId?: number;
  buyerId: number;
  sellerId: number;
  status: string;
  lastMessage?: string;
  unreadCount?: number;
  createdAt: string;
}

interface Message {
  id: number;
  chatId: number;
  senderId: number;
  content: string;
  messageType: 'text' | 'image' | 'system' | 'ai_admin';
  createdAt: string;
}

export default function Chat() {
  const { id: chatId } = useParams();
  const [, setLocation] = useLocation();
  const [newMessage, setNewMessage] = useState("");
  const { user } = useAuth();
  const currentUserId = user?.id || 0; // Get user ID from auth context
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // WebSocket connection
  const { isConnected, sendMessage: sendWsMessage } = useWebSocket(currentUserId, {
    onMessage: (message) => {
      if (message.type === 'new_message') {
        // Invalidate messages query to refetch
        queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`] });
      }
    }
  });

  // Fetch chat list
  const { data: chatList = [] } = useQuery<ChatListItem[]>({
    queryKey: ["/api/chats"],
    enabled: !chatId, // Only fetch when showing chat list
  });

  // Fetch messages for specific chat
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: [`/api/chats/${chatId}/messages`],
    enabled: !!chatId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!chatId) throw new Error("No chat selected");
      
      // Send via WebSocket for real-time delivery
      const sent = sendWsMessage({
        type: 'chat_message',
        chatId: parseInt(chatId),
        senderId: currentUserId,
        content
      });

      if (!sent) {
        // Fallback to HTTP if WebSocket fails
        return apiRequest(`/api/chats/${chatId}/messages`, { 
          method: 'POST', 
          body: JSON.stringify({ content }) 
        });
      }
    },
    onSuccess: () => {
      setNewMessage("");
      // Messages will be updated via WebSocket, but invalidate as backup
      queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`] });
    }
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(newMessage.trim());
    }
  };

  const handleChatClick = (chatId: number) => {
    setLocation(`/chat/${chatId}`);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getMessageStyle = (senderId: number, messageType: string) => {
    if (messageType === 'ai_admin') {
      return "bg-yellow-600/20 border border-yellow-600/30 text-yellow-100";
    }
    if (messageType === 'system') {
      return "bg-gray-600/20 border border-gray-600/30 text-gray-300";
    }
    if (senderId === currentUserId) {
      return "bg-nxe-primary text-white ml-auto";
    }
    return "bg-nxe-surface text-white";
  };

  // Chat List View
  if (!chatId) {
    return (
      <div className="min-h-screen bg-nxe-dark">
        <div className="sticky top-0 bg-nxe-dark/95 backdrop-blur-md border-b border-nxe-surface p-4">
          <h1 className="text-xl font-semibold text-white">Messages</h1>
        </div>

        <div className="p-4 space-y-2">
          {chatList.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-16 w-16 mx-auto text-gray-500 mb-4" />
              <p className="text-gray-400">No conversations yet</p>
              <p className="text-gray-500 text-sm mt-2">
                Start buying or selling to begin chatting
              </p>
            </div>
          ) : (
            chatList.map((chat) => (
              <Card
                key={chat.id}
                className="bg-nxe-card border-nxe-surface cursor-pointer hover:bg-nxe-surface transition-colors"
                onClick={() => handleChatClick(chat.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={`https://images.unsplash.com/photo-${1500 + chat.id}?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100`} />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-white font-medium">Chat #{chat.id}</p>
                        <span className="text-xs text-gray-400">
                          {new Date(chat.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p className="text-gray-400 text-sm truncate">
                        {chat.lastMessage || "Start your conversation"}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <Badge 
                          variant={chat.status === 'active' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {chat.status}
                        </Badge>
                        
                        {chat.unreadCount && chat.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  // Chat Detail View
  return (
    <div className="min-h-screen bg-nxe-dark flex flex-col">
      {/* Chat Header */}
      <div className="sticky top-0 bg-nxe-dark/95 backdrop-blur-md border-b border-nxe-surface p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/chat")}
              className="p-1"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </Button>
            
            <Avatar className="w-10 h-10">
              <AvatarImage src={`https://images.unsplash.com/photo-${1600 + parseInt(chatId)}?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100`} />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            
            <div>
              <p className="text-white font-medium">Chat #{chatId}</p>
              <p className="text-xs text-gray-400">
                {isConnected ? "Online" : "Connecting..."}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="p-2">
              <Phone className="h-4 w-4 text-gray-400" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2">
              <Video className="h-4 w-4 text-gray-400" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2">
              <MoreVertical className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${getMessageStyle(message.senderId, message.messageType)}`}>
              {message.messageType === 'ai_admin' && (
                <div className="flex items-center space-x-1 mb-1">
                  <Badge variant="outline" className="text-xs border-yellow-600/50">
                    AI Admin
                  </Badge>
                </div>
              )}
              
              <p className="text-sm break-words">{message.content}</p>
              
              <p className="text-xs opacity-70 mt-1">
                {formatMessageTime(message.createdAt)}
              </p>
            </div>
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="sticky bottom-0 bg-nxe-dark/95 backdrop-blur-md border-t border-nxe-surface p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message... (use @admin to get help)"
            className="flex-1 bg-nxe-surface border-nxe-surface text-white rounded-full px-4"
            disabled={sendMessageMutation.isPending}
          />
          
          <Button
            type="submit"
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
            className="bg-nxe-primary hover:bg-nxe-primary/80 rounded-full p-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
