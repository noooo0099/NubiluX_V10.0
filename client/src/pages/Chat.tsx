import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { Send, Phone, Video, MoreVertical, ArrowLeft, User, Camera, Search, Paperclip, FileText, Download, Check, CheckCheck, Users, Megaphone, Star, Mail, Settings, UserCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/useWebSocket";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

interface EscrowTransaction {
  id: number;
  buyerId: number;
  sellerId: number;
  productId: number;
  amount: string;
  status: 'pending' | 'active' | 'completed' | 'disputed' | 'cancelled';
  aiStatus: 'processing' | 'approved' | 'flagged' | 'manual_review';
  riskScore?: number;
  approvedBy?: number;
  approvedAt?: string;
  adminNote?: string;
  completedBy?: number;
  completedAt?: string;
  completionNote?: string;
  createdAt: string;
}

interface ChatListItem {
  id: number;
  productId?: number;
  buyerId: number;
  sellerId: number;
  status: string;
  createdAt: string;
  // Product info
  productTitle?: string;
  productThumbnail?: string;
  productPrice?: string;
  productCategory?: string;
  // Other participant info
  otherUser?: {
    username: string;
    displayName?: string;
    profilePicture?: string;
    isVerified: boolean;
  };
  isCurrentUserBuyer: boolean;
  // Message info
  lastMessage?: string;
  lastMessageType?: string;
  lastMessageTime?: string;
  lastMessageSenderId?: number;
  unreadCount: number;
  // Escrow transaction info
  escrowTransaction?: EscrowTransaction | null;
}

interface Message {
  id: number;
  chatId: number;
  senderId: number;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system' | 'ai_admin';
  metadata?: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    uploadedAt?: string;
  };
  // WhatsApp-style status fields
  status: 'sent' | 'delivered' | 'read';
  deliveredAt?: string;
  readAt?: string;
  createdAt: string;
}

interface ChatDetails {
  id: number;
  productId?: number;
  buyerId: number;
  sellerId: number;
  status: string;
  createdAt: string;
  // Product info
  productTitle?: string;
  productThumbnail?: string;
  productPrice?: string;
  productCategory?: string;
  // Buyer info
  buyerUsername?: string;
  buyerDisplayName?: string;
  buyerProfilePicture?: string;
  buyerIsVerified?: boolean;
  // Seller info
  sellerUsername?: string;
  sellerDisplayName?: string;
  sellerProfilePicture?: string;
  sellerIsVerified?: boolean;
  // Message info
  lastMessage?: string;
  lastMessageType?: string;
  lastMessageTime?: string;
  lastMessageSenderId?: number;
  unreadCount: number;
  // Escrow transaction info
  escrowTransaction?: EscrowTransaction | null;
}

export default function Chat() {
  const { id: chatId } = useParams();
  const [, setLocation] = useLocation();
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const currentUserId = user?.id || 0; // Get user ID from auth context
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // WebSocket connection
  const { isConnected, sendMessage: sendWsMessage } = useWebSocket(currentUserId, {
    onMessage: (message) => {
      if (message.type === 'new_message') {
        // Invalidate messages query to refetch
        queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`] });
        // Also invalidate chat list to update last message and ordering
        queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
        // Invalidate chat details to update last message info
        queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}`] });
      }
    }
  });

  // Fetch chat list
  const { data: chatList = [] } = useQuery<ChatListItem[]>({
    queryKey: ["/api/chats"],
    enabled: !chatId, // Only fetch when showing chat list
  });

  // Fetch detailed chat info for header
  const { data: chatDetails } = useQuery<ChatDetails>({
    queryKey: [`/api/chats/${chatId}`],
    enabled: !!chatId,
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
      // Also invalidate chat list to update last message and ordering
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      // Invalidate chat details to update last message info
      queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}`] });
    }
  });

  // Complete transaction mutation
  const completeTransactionMutation = useMutation({
    mutationFn: async (completionNote?: string) => {
      if (!chatId) throw new Error("No chat selected");
      return apiRequest(`/api/chats/${chatId}/actions/complete`, {
        method: 'POST',
        body: JSON.stringify({ completionNote })
      });
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`] });
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}`] });
    }
  });

  // Dispute transaction mutation
  const disputeTransactionMutation = useMutation({
    mutationFn: async (disputeReason: string) => {
      if (!chatId) throw new Error("No chat selected");
      return apiRequest(`/api/chats/${chatId}/actions/dispute`, {
        method: 'POST',
        body: JSON.stringify({ disputeReason })
      });
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`] });
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}`] });
    }
  });

  // Message status update mutations
  const markAsDeliveredMutation = useMutation({
    mutationFn: async (messageId: number) => {
      return apiRequest(`/api/messages/${messageId}/delivered`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`] });
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      return apiRequest(`/api/messages/${messageId}/read`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`] });
    }
  });

  // File upload mutation
  const fileUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      // Get token for authentication
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`/api/chats/${chatId}/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`] });
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}`] });
    },
    onError: (error: any) => {
      alert(error.message || 'Failed to upload file');
    }
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(newMessage.trim());
    }
  };

  // Handle file selection and upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Reset input
    e.target.value = '';
    
    try {
      await fileUploadMutation.mutateAsync(file);
    } catch (error) {
      console.error('Failed to upload file:', error);
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
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
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // WhatsApp-style time formatting
    if (diffDays === 0) {
      // Today: show time only
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else if (diffDays === 1) {
      // Yesterday
      return 'Yesterday';
    } else if (diffDays < 7) {
      // This week: show day name
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      // Older: show date
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // WhatsApp-style status indicator component
  const MessageStatusIndicator = ({ message }: { message: Message }) => {
    if (message.senderId !== currentUserId) return null; // Only show for sent messages
    if (message.messageType === 'system' || message.messageType === 'ai_admin') return null;

    const getStatusIcon = () => {
      switch (message.status) {
        case 'sent':
          return <Check className="h-3 w-3 text-gray-400" />;
        case 'delivered':
          return <CheckCheck className="h-3 w-3 text-gray-400" />;
        case 'read':
          return <CheckCheck className="h-3 w-3 text-blue-400" />;
        default:
          return <Check className="h-3 w-3 text-gray-400" />;
      }
    };

    return (
      <span className="inline-flex items-center ml-1" data-testid={`status-${message.status}-${message.id}`}>
        {getStatusIcon()}
      </span>
    );
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

  // Filter chat list based on search
  const filteredChatList = chatList.filter(chat => 
    searchQuery === "" || 
    chat.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.productTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.otherUser?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `Chat #${chat.id}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper functions with null-safety
  const formatTimeAgo = (timestamp?: string | null) => {
    if (!timestamp) return '';
    try {
      const now = new Date();
      const messageTime = new Date(timestamp);
      
      // Check if the date is valid
      if (isNaN(messageTime.getTime())) {
        return '';
      }
      
      const diffInHours = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) {
        const diffInMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));
        return diffInMinutes < 1 ? 'Sekarang' : `${diffInMinutes}m`;
      } else if (diffInHours < 24) {
        return `${diffInHours}h`;
      } else if (diffInHours < 48) {
        return 'Kemarin';
      } else {
        return messageTime.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
      }
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  const getDisplayName = (chat: ChatListItem) => {
    if (chat.otherUser?.displayName) {
      return chat.otherUser.displayName;
    }
    if (chat.otherUser?.username) {
      return chat.otherUser.username;
    }
    return `User ${chat.isCurrentUserBuyer ? chat.sellerId : chat.buyerId}`;
  };

  const getProfilePicture = (chat: ChatListItem) => {
    if (chat.otherUser?.profilePicture) {
      return chat.otherUser.profilePicture;
    }
    return `https://images.unsplash.com/photo-${1500 + chat.id}?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100`;
  };

  const getAvatarFallback = (chat: ChatListItem) => {
    const name = getDisplayName(chat);
    return name ? name[0]?.toUpperCase() || 'U' : 'U';
  };

  // Escrow transaction helper functions
  const getEscrowStatusLabel = (status?: string) => {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'active': return 'Aktif';
      case 'completed': return 'Selesai';
      case 'disputed': return 'Sengketa';
      case 'cancelled': return 'Dibatalkan';
      default: return 'Tidak ada transaksi';
    }
  };

  const getEscrowStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'disputed': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const canCompleteTransaction = (escrow?: EscrowTransaction | null) => {
    // Only buyers can complete transactions for security
    return escrow && escrow.status === 'active' && chatDetails && chatDetails.buyerId === currentUserId;
  };

  const canDisputeTransaction = (escrow?: EscrowTransaction | null) => {
    return escrow && (escrow.status === 'pending' || escrow.status === 'active');
  };

  const handleCompleteTransaction = async () => {
    if (!chatDetails?.escrowTransaction) return;
    
    // Confirm with user before completing
    const confirmed = confirm('Apakah Anda yakin ingin menyelesaikan transaksi ini? Dana akan dirilis ke penjual.');
    if (!confirmed) return;
    
    try {
      await completeTransactionMutation.mutateAsync(undefined);
    } catch (error) {
      console.error('Error completing transaction:', error);
      alert('Gagal menyelesaikan transaksi. Silakan coba lagi.');
    }
  };

  const handleDisputeTransaction = async () => {
    if (!chatDetails?.escrowTransaction) return;
    const reason = prompt('Alasan sengketa (maksimal 1000 karakter):');
    if (!reason || reason.trim().length === 0) return;
    if (reason.length > 1000) {
      alert('Alasan terlalu panjang. Maksimal 1000 karakter.');
      return;
    }
    
    try {
      await disputeTransactionMutation.mutateAsync(reason.trim());
    } catch (error) {
      console.error('Error disputing transaction:', error);
      alert('Gagal melaporkan sengketa. Silakan coba lagi.');
    }
  };

  // Chat List View
  if (!chatId) {
    return (
      <div className="min-h-screen bg-nxe-dark">
        {/* WhatsApp-style Header */}
        <div className="sticky top-0 bg-nxe-dark/95 backdrop-blur-md border-b border-nxe-surface">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-bold text-white">NubiluXchange</h1>
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-2 hover:bg-transparent hover:scale-105 shrink-0 transition-all duration-200 ease-in-out" 
                  data-testid="button-camera"
                  onClick={() => {
                    // Trigger camera functionality (placeholder for now)
                    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                      navigator.mediaDevices.getUserMedia({ video: true })
                        .then(stream => {
                          // Camera access granted - you can implement camera UI here
                          console.log('Camera access granted');
                          // Stop the stream for now (just testing access)
                          stream.getTracks().forEach(track => track.stop());
                        })
                        .catch(err => {
                          console.error('Camera access denied:', err);
                          alert('Akses kamera ditolak. Pastikan Anda memberikan izin kamera.');
                        });
                    } else {
                      alert('Kamera tidak tersedia di perangkat ini.');
                    }
                  }}
                >
                  <Camera className="h-5 w-5 text-gray-300 hover:text-white transition-colors duration-200" />
                </Button>
                
                {/* WhatsApp-style Dropdown Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-2 hover:bg-transparent hover:scale-105 shrink-0 transition-all duration-200 ease-in-out" 
                      data-testid="button-menu"
                    >
                      <MoreVertical className="h-5 w-5 text-gray-300 hover:text-white transition-colors duration-200" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-nxe-surface border border-nxe-primary/20 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
                    <DropdownMenuItem className="cursor-pointer hover:bg-nxe-primary/10 transition-colors duration-150">
                      <Users className="mr-3 h-4 w-4 text-gray-400" />
                      <span className="text-white">Grup baru</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer hover:bg-nxe-primary/10 transition-colors duration-150">
                      <Users className="mr-3 h-4 w-4 text-gray-400" />
                      <span className="text-white">Komunitas baru</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer hover:bg-nxe-primary/10 transition-colors duration-150">
                      <Megaphone className="mr-3 h-4 w-4 text-gray-400" />
                      <span className="text-white">Siaran baru</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-nxe-primary/20" />
                    <DropdownMenuItem className="cursor-pointer hover:bg-nxe-primary/10 transition-colors duration-150">
                      <Smartphone className="mr-3 h-4 w-4 text-gray-400" />
                      <span className="text-white">Perangkat tertaut</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer hover:bg-nxe-primary/10 transition-colors duration-150">
                      <Star className="mr-3 h-4 w-4 text-gray-400" />
                      <span className="text-white">Berbintang</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer hover:bg-nxe-primary/10 transition-colors duration-150">
                      <Mail className="mr-3 h-4 w-4 text-gray-400" />
                      <span className="text-white">Baca semua</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-nxe-primary/20" />
                    <DropdownMenuItem onClick={() => setLocation("/settings")} className="cursor-pointer hover:bg-nxe-primary/10 transition-colors duration-150">
                      <Settings className="mr-3 h-4 w-4 text-gray-400" />
                      <span className="text-white">Pengaturan</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer hover:bg-nxe-primary/10 transition-colors duration-150">
                      <UserCheck className="mr-3 h-4 w-4 text-gray-400" />
                      <span className="text-white">Ganti akun</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* WhatsApp-style Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Tanya AI atau Cari..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-nxe-surface/50 border-0 rounded-full text-white placeholder-gray-400 focus:bg-nxe-surface focus:ring-2 focus:ring-nxe-primary/50"
                data-testid="input-search-chats"
              />
            </div>
          </div>
        </div>

        <div className="p-4 space-y-2">
          {filteredChatList.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-16 w-16 mx-auto text-gray-500 mb-4" />
              <p className="text-gray-400">
                {searchQuery ? "No conversations found" : "No conversations yet"}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {searchQuery ? "Try a different search term" : "Start buying or selling to begin chatting"}
              </p>
            </div>
          ) : (
            filteredChatList.map((chat) => (
              <Card
                key={chat.id}
                className="bg-nxe-card border-nxe-surface cursor-pointer hover:bg-nxe-surface transition-colors"
                onClick={() => handleChatClick(chat.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={getProfilePicture(chat)} />
                        <AvatarFallback>{getAvatarFallback(chat)}</AvatarFallback>
                      </Avatar>
                      {chat.otherUser?.isVerified && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <p className="text-white font-medium">{getDisplayName(chat)}</p>
                          {chat.otherUser?.isVerified && (
                            <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {chat.lastMessageTime ? formatTimeAgo(chat.lastMessageTime) : formatTimeAgo(chat.createdAt)}
                        </span>
                      </div>
                      
                      {/* Product info */}
                      {chat.productTitle && (
                        <div className="flex items-center space-x-2 mt-1">
                          {chat.productThumbnail && (
                            <img 
                              src={chat.productThumbnail} 
                              alt={chat.productTitle}
                              className="w-4 h-4 rounded object-cover"
                            />
                          )}
                          <p className="text-xs text-blue-400 truncate">
                            {chat.productTitle} {chat.productPrice && `- Rp ${parseFloat(chat.productPrice).toLocaleString('id-ID')}`}
                          </p>
                        </div>
                      )}
                      
                      <p className="text-gray-400 text-sm truncate mt-1">
                        {chat.lastMessage || "Mulai percakapan Anda"}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={chat.status === 'active' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {chat.status === 'active' ? 'Aktif' : chat.status === 'completed' ? 'Selesai' : 'Sengketa'}
                          </Badge>
                          
                          {/* Escrow Status Indicator */}
                          {chat.escrowTransaction && (
                            <div className="flex items-center space-x-1">
                              <div className={`w-2 h-2 rounded-full ${getEscrowStatusColor(chat.escrowTransaction.status)}`}></div>
                              <Badge variant="outline" className="text-xs">
                                {getEscrowStatusLabel(chat.escrowTransaction.status)}
                              </Badge>
                            </div>
                          )}
                          
                          {chat.productCategory && (
                            <Badge variant="outline" className="text-xs">
                              {chat.productCategory}
                            </Badge>
                          )}
                        </div>
                        
                        {chat.unreadCount !== undefined && chat.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs min-w-[20px] h-5 rounded-full flex items-center justify-center">
                            {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
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
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/chat")}
              className="p-1"
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </Button>
            
            <div className="relative">
              <Avatar className="w-10 h-10">
                <AvatarImage src={chatDetails ? 
                  (currentUserId === chatDetails.buyerId ? 
                    (chatDetails.sellerProfilePicture || `https://images.unsplash.com/photo-${1600 + chatDetails.sellerId}?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100`) :
                    (chatDetails.buyerProfilePicture || `https://images.unsplash.com/photo-${1600 + chatDetails.buyerId}?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100`)
                  ) : `https://images.unsplash.com/photo-${1600 + parseInt(chatId)}?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100`
                } />
                <AvatarFallback>
                  {chatDetails ? 
                    (currentUserId === chatDetails.buyerId ? 
                      (chatDetails.sellerDisplayName?.[0] || chatDetails.sellerUsername?.[0] || 'S') :
                      (chatDetails.buyerDisplayName?.[0] || chatDetails.buyerUsername?.[0] || 'B')
                    ).toUpperCase() : 'U'
                  }
                </AvatarFallback>
              </Avatar>
              {chatDetails && (
                (currentUserId === chatDetails.buyerId ? chatDetails.sellerIsVerified : chatDetails.buyerIsVerified) && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="text-white font-medium truncate">
                  {chatDetails ? 
                    (currentUserId === chatDetails.buyerId ? 
                      (chatDetails.sellerDisplayName || chatDetails.sellerUsername || 'Penjual') :
                      (chatDetails.buyerDisplayName || chatDetails.buyerUsername || 'Pembeli')
                    ) : `Chat #${chatId}`
                  }
                </p>
                {chatDetails && (
                  (currentUserId === chatDetails.buyerId ? chatDetails.sellerIsVerified : chatDetails.buyerIsVerified) && (
                    <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                  )
                )}
              </div>
              
              {/* Product info in header */}
              {chatDetails?.productTitle && (
                <p className="text-xs text-blue-400 truncate">
                  {chatDetails.productTitle}
                  {chatDetails.productPrice && ` - Rp ${parseFloat(chatDetails.productPrice).toLocaleString('id-ID')}`}
                </p>
              )}
              
              <p className="text-xs text-gray-400">
                {isConnected ? "Online" : "Menghubungkan..."} • {chatDetails?.status === 'active' ? 'Aktif' : chatDetails?.status === 'completed' ? 'Selesai' : chatDetails?.status || 'Loading...'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Escrow Action Buttons */}
            {chatDetails?.escrowTransaction && (
              <>
                {canCompleteTransaction(chatDetails.escrowTransaction) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-2 text-green-400 hover:text-green-300" 
                    onClick={handleCompleteTransaction}
                    disabled={completeTransactionMutation.isPending}
                    data-testid="button-complete-transaction"
                  >
                    ✓
                  </Button>
                )}
                {canDisputeTransaction(chatDetails.escrowTransaction) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-2 text-red-400 hover:text-red-300" 
                    onClick={handleDisputeTransaction}
                    disabled={disputeTransactionMutation.isPending}
                    data-testid="button-dispute-transaction"
                  >
                    ⚠️
                  </Button>
                )}
              </>
            )}
            
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
              
              {/* Render different message types */}
              {message.messageType === 'image' ? (
                <div className="space-y-2">
                  <img 
                    src={message.content} 
                    alt="Shared image" 
                    className="max-w-full h-auto rounded-lg cursor-pointer"
                    onClick={() => window.open(message.content, '_blank')}
                    data-testid={`image-message-${message.id}`}
                  />
                  {message.metadata?.fileName && (
                    <p className="text-xs opacity-70">{message.metadata.fileName}</p>
                  )}
                </div>
              ) : message.messageType === 'file' ? (
                <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg">
                  <FileText className="h-8 w-8 text-blue-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {message.metadata?.fileName || 'File'}
                    </p>
                    {message.metadata?.fileSize && (
                      <p className="text-xs opacity-70">
                        {(message.metadata.fileSize / 1024).toFixed(1)} KB
                      </p>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => window.open(message.content, '_blank')}
                    className="text-blue-400 hover:text-blue-300"
                    data-testid={`download-file-${message.id}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <p className="text-sm break-words">{message.content}</p>
              )}
              
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs opacity-70">
                  {formatMessageTime(message.createdAt)}
                </p>
                <MessageStatusIndicator message={message} />
              </div>
            </div>
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="sticky bottom-0 bg-nxe-dark/95 backdrop-blur-md border-t border-nxe-surface p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          {/* File Upload Input (Hidden) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt,.zip"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="input-file-attachment"
          />
          
          {/* Attachment Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAttachmentClick}
            disabled={fileUploadMutation.isPending}
            className="text-gray-400 hover:text-white p-2"
            data-testid="button-attachment"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message... (use @admin to get help)"
            className="flex-1 bg-nxe-surface border-nxe-surface text-white rounded-full px-4"
            disabled={sendMessageMutation.isPending || fileUploadMutation.isPending}
            data-testid="input-message"
          />
          
          <Button
            type="submit"
            disabled={!newMessage.trim() || sendMessageMutation.isPending || fileUploadMutation.isPending}
            className="bg-nxe-primary hover:bg-nxe-primary/80 rounded-full p-3"
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        
        {/* Upload Progress */}
        {fileUploadMutation.isPending && (
          <div className="mt-2 text-sm text-gray-400 flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-nxe-primary"></div>
            <span>Uploading file...</span>
          </div>
        )}
      </div>
    </div>
  );
}
