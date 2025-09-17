import { Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface NewsItem {
  id: number;
  title: string;
  content: string;
  thumbnail?: string;
  createdAt: string;
  author: string;
  isPinned?: boolean;
}

export default function FeaturedProducts() {
  const [, setLocation] = useLocation();
  const { data: newsItems = [] } = useQuery<NewsItem[]>({
    queryKey: ["/api/news/daily"],
  });

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const handleNewsClick = (newsId: number) => {
    // TODO: Implement news detail page
    console.log('News clicked:', newsId);
  };

  return (
    <section className="px-4 py-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">News In Day</h2>
        <button 
          className="text-nxe-primary text-sm font-medium hover:text-nxe-accent transition-colors"
          data-testid="button-view-all-news"
          onClick={() => console.log('View all news - TODO: implement')}
        >
          View All
        </button>
      </div>
      
      <div className="space-y-4">
        {newsItems.map((news) => (
          <Card 
            key={news.id}
            className={`nxe-featured-card ${news.isPinned ? 'animate-pulse-glow' : ''}`}
            data-testid={`news-card-${news.id}`}
          >
            <CardContent className="p-0">
              <div className="flex space-x-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                  <img 
                    src={news.thumbnail || '/api/placeholder/300/300'}
                    alt={news.title}
                    className="w-full h-full object-cover" 
                  />
                </div>
                
                <div className="flex-1 min-w-0 py-2">
                  <h3 className="text-white font-medium text-sm mb-1 line-clamp-1">
                    {news.title}
                  </h3>
                  <p className="text-gray-400 text-xs mb-2 line-clamp-2">
                    {news.content}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-nxe-primary" />
                        <span className="text-nxe-accent text-xs">
                          {formatDate(news.createdAt)}
                        </span>
                      </div>
                      {news.isPinned && (
                        <Badge className="bg-nxe-primary px-2 py-1 text-xs text-white">
                          Pinned
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-400">Admin</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
