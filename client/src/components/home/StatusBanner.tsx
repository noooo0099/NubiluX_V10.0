import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function StatusBanner() {
  const { data: statusUpdates = [] } = useQuery({
    queryKey: ["/api/status"],
  });

  const sampleStatuses = [
    {
      id: 1,
      username: "GamePro",
      media: "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      gradient: "from-nxe-primary to-nxe-accent"
    },
    {
      id: 2,
      username: "ProGamer",
      media: "https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      id: 3,
      username: "GearHead",
      media: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      gradient: "from-yellow-500 to-orange-500"
    }
  ];

  const handleStatusClick = (statusId: number) => {
    // Show status in full screen modal
    const statusModal = document.createElement('div');
    statusModal.className = 'fixed inset-0 z-50 bg-black flex items-center justify-center';
    statusModal.innerHTML = `
      <div class="relative w-full h-full">
        <img src="${sampleStatuses.find(s => s.id === statusId)?.media}" 
             class="w-full h-full object-cover" />
        <button onclick="this.closest('.fixed').remove()" 
                class="absolute top-4 right-4 text-white text-2xl">&times;</button>
      </div>
    `;
    document.body.appendChild(statusModal);
  };

  const handleAddStatus = () => {
    // Navigate to upload page with status tab
    window.location.href = '/upload';
  };

  return (
    <section className="px-4 py-3 bg-gradient-to-r from-nxe-surface to-nxe-card">
      <div className="flex items-center space-x-3 overflow-x-auto scrollbar-hide">
        {/* Add Status Button */}
        <div className="flex-shrink-0">
          <button 
            onClick={handleAddStatus}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-nxe-primary to-nxe-accent flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
          >
            <Plus className="text-white text-xl" />
          </button>
          <p className="text-xs text-center mt-1 text-gray-400">Add Status</p>
        </div>
        
        {/* Status Items */}
        {sampleStatuses.map((status) => (
          <div 
            key={status.id}
            className="nxe-status-item"
            onClick={() => handleStatusClick(status.id)}
          >
            <div className={`w-16 h-16 rounded-full p-0.5 bg-gradient-to-r ${status.gradient}`}>
              <div className="w-full h-full rounded-full overflow-hidden">
                <img 
                  src={status.media}
                  alt={`${status.username} status`}
                  className="w-full h-full object-cover" 
                />
              </div>
            </div>
            <p className="text-xs text-center mt-1 text-gray-400">{status.username}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
