import { Plus, Eye, Repeat2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface StatusUser {
  id: number;
  username: string;
  content: string;
  createdAt: string;
}

export default function StatusBanner() {
  const [statusModal, setStatusModal] = useState<{ isOpen: boolean; statusId?: number }>({ isOpen: false });
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: statusUpdates = [] } = useQuery<StatusUser[]>({
    queryKey: ["/api/status"],
  });

  // Mutation for handling status repost
  const repostStatusMutation = useMutation({
    mutationFn: async ({ statusId }: { statusId: number }) => {
      return apiRequest('/api/reposts', {
        method: 'POST',
        body: JSON.stringify({ statusId })
      });
    },
    onSuccess: (data) => {
      const action = data.isReposted ? 'direpost' : 'dibatalkan repostnya';
      toast({
        title: data.isReposted ? "Berhasil repost!" : "Repost dibatalkan",
        description: `Status telah ${action}`,
      });
      // Invalidate all repost-related queries (covers all user-specific queries too)
      queryClient.invalidateQueries({ queryKey: ['/api/reposts'] });
    },
    onError: (error) => {
      toast({
        title: "Gagal repost",
        description: "Terjadi kesalahan saat mencoba repost status",
        variant: "destructive",
      });
    }
  });

  // My status (always first)
  const myStatus = {
    id: 0,
    username: "Status saya",
    profilePicture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face",
    hasNewStatus: false,
    isMyStatus: true
  };

  // Transform real status data with profile pictures
  const realStatuses = statusUpdates.map((status, index) => ({
    id: status.id,
    username: status.username,
    content: status.content,
    profilePicture: `https://images.unsplash.com/photo-${150000000 + index}?w=60&h=60&fit=crop&crop=face`,
    hasNewStatus: true,
    createdAt: status.createdAt
  }));

  const handleStatusClick = (statusId: number) => {
    if (statusId === 0) {
      // Navigate to upload for adding new status
      setLocation('/upload');
      return;
    }
    setStatusModal({ isOpen: true, statusId });
  };

  const handleAddStatus = () => {
    setLocation('/upload');
  };

  const closeStatusModal = () => {
    setStatusModal({ isOpen: false });
  };

  const handleStatusRepost = async (statusId: number) => {
    if (repostStatusMutation.isPending) return;
    repostStatusMutation.mutate({ statusId });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  return (
    <>
      <section className="px-4 py-3 bg-nxe-surface/50">
        <div className="flex items-center space-x-4 overflow-x-auto scrollbar-hide">
          {/* My Status */}
          <div className="flex-shrink-0">
            <div 
              onClick={() => handleStatusClick(0)}
              className="relative cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full overflow-hidden bg-nxe-card border-2 border-nxe-border">
                <img 
                  src={myStatus.profilePicture}
                  alt="My status"
                  className="w-full h-full object-cover" 
                />
              </div>
              {!myStatus.hasNewStatus && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-nxe-primary rounded-full flex items-center justify-center border-2 border-nxe-surface">
                  <Plus className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <p className="text-xs text-center mt-2 text-nxe-text-secondary max-w-[60px] truncate">
              {myStatus.username}
            </p>
          </div>
          
          {/* Real Status Items */}
          {realStatuses.map((status) => (
            <div 
              key={status.id}
              className="flex-shrink-0"
              onClick={() => handleStatusClick(status.id)}
            >
              <div className="relative cursor-pointer">
                <div className={`w-16 h-16 rounded-full p-0.5 ${status.hasNewStatus ? 'bg-gradient-to-r from-nxe-primary to-nxe-accent' : 'bg-nxe-border'}`}>
                  <div className="w-full h-full rounded-full overflow-hidden bg-nxe-surface">
                    <img 
                      src={status.profilePicture}
                      alt={`${status.username} status`}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-center mt-2 text-nxe-text-secondary max-w-[60px] truncate">
                {status.username}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Status Modal */}
      {statusModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black">
          <div className="relative w-full h-full">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <img 
                      src={realStatuses.find(s => s.id === statusModal.statusId)?.profilePicture}
                      alt="Profile"
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">
                      {realStatuses.find(s => s.id === statusModal.statusId)?.username}
                    </p>
                    <p className="text-white/70 text-xs">
                      {realStatuses.find(s => s.id === statusModal.statusId)?.createdAt && 
                       getTimeAgo(realStatuses.find(s => s.id === statusModal.statusId)!.createdAt)}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={closeStatusModal}
                  className="text-white text-2xl hover:text-nxe-primary transition-colors"
                >
                  ×
                </button>
              </div>
              
              {/* Progress bar */}
              <div className="mt-3">
                <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full animate-pulse" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex items-center justify-center h-full px-4">
              <div className="text-center">
                <p className="text-white text-lg leading-relaxed">
                  {realStatuses.find(s => s.id === statusModal.statusId)?.content}
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button className="text-white hover:text-nxe-primary transition-colors">
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => statusModal.statusId && handleStatusRepost(statusModal.statusId)}
                    disabled={repostStatusMutation.isPending}
                    className={`transition-colors ${
                      repostStatusMutation.isPending 
                        ? 'text-gray-500 cursor-not-allowed' 
                        : 'text-white hover:text-nxe-primary'
                    }`}
                    data-testid={`button-repost-status-${statusModal.statusId}`}
                    title="Repost status ini"
                  >
                    <Repeat2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  <input 
                    type="text" 
                    placeholder="Balas status..."
                    className="bg-white/20 text-white placeholder-white/70 px-4 py-2 rounded-full flex-1 max-w-xs text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
