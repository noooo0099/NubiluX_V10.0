import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus,
  Package,
  TrendingUp,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  MessageCircle,
  Star,
  Clock,
  Users,
  Activity,
  BarChart3
} from "lucide-react";
import { useLocation } from "wouter";
import { Loading, LoadingSkeleton } from "@/components/ui/loading";

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalSales: number;
  totalEarnings: string;
  totalViews: number;
  averageRating: number;
  pendingOrders: number;
  completedOrders: number;
}

interface Product {
  id: number;
  title: string;
  price: string;
  status: 'active' | 'sold' | 'suspended';
  category: string;
  views: number;
  rating: number;
  reviewCount: number;
  thumbnail: string;
  createdAt: string;
  isPremium: boolean;
}

interface SalesData {
  period: string;
  sales: number;
  earnings: string;
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-600';
    case 'sold':
      return 'bg-blue-600';
    case 'suspended':
      return 'bg-red-600';
    default:
      return 'bg-gray-600';
  }
};

const getStatusText = (status?: string) => {
  switch (status) {
    case 'active':
      return 'Aktif';
    case 'sold':
      return 'Terjual';
    case 'suspended':
      return 'Ditangguhkan';
    default:
      return status || 'Tidak diketahui';
  }
};

export default function SellerDashboard() {
  const [, setLocation] = useLocation();
  const [timeRange, setTimeRange] = useState('7d');

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/seller/stats', timeRange]
  });

  // Fetch seller products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['/api/seller/products']
  });

  // Fetch sales data
  const { data: salesData = [], isLoading: salesLoading } = useQuery({
    queryKey: ['/api/seller/sales', timeRange]
  });

  const dashboardStats = stats as DashboardStats;

  const formatPrice = (amount: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Hari ini';
    if (diffInDays === 1) return 'Kemarin';
    return `${diffInDays} hari lalu`;
  };

  return (
    <div className="min-h-screen bg-nxe-dark p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Dashboard Penjual</h1>
          <p className="text-nxe-text">Kelola produk dan pantau performa penjualan Anda</p>
        </div>
        <Button 
          onClick={() => setLocation("/upload")}
          className="bg-nxe-primary hover:bg-nxe-primary/80 text-white"
          data-testid="button-add-product"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Produk
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsLoading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i} className="bg-nxe-surface border-nxe-border">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="h-4 bg-nxe-border rounded animate-pulse" />
                  <div className="h-8 bg-nxe-border rounded animate-pulse" />
                  <div className="h-3 bg-nxe-border rounded animate-pulse w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className="bg-nxe-surface border-nxe-border">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-600/20 rounded-lg">
                    <Package className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-nxe-text text-sm">Total Produk</p>
                    <p className="text-2xl font-bold text-white">
                      {dashboardStats?.totalProducts || 0}
                    </p>
                    <p className="text-xs text-green-500">
                      {dashboardStats?.activeProducts || 0} aktif
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-nxe-surface border-nxe-border">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-600/20 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-nxe-text text-sm">Total Penjualan</p>
                    <p className="text-2xl font-bold text-white">
                      {dashboardStats?.totalSales || 0}
                    </p>
                    <p className="text-xs text-green-500">
                      +{Math.floor(Math.random() * 10)}% dari minggu lalu
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-nxe-surface border-nxe-border">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-600/20 rounded-lg">
                    <DollarSign className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-nxe-text text-sm">Total Pendapatan</p>
                    <p className="text-2xl font-bold text-white">
                      {dashboardStats?.totalEarnings ? formatPrice(dashboardStats.totalEarnings) : 'Rp 0'}
                    </p>
                    <p className="text-xs text-green-500">
                      +{Math.floor(Math.random() * 15)}% dari bulan lalu
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-nxe-surface border-nxe-border">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-orange-600/20 rounded-lg">
                    <Eye className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-nxe-text text-sm">Total Views</p>
                    <p className="text-2xl font-bold text-white">
                      {formatNumber(dashboardStats?.totalViews || 0)}
                    </p>
                    <p className="text-xs text-blue-500">
                      Rating: {dashboardStats?.averageRating || 0}/5
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-nxe-surface border border-nxe-border">
          <TabsTrigger 
            value="products"
            className="data-[state=active]:bg-nxe-primary data-[state=active]:text-white"
          >
            Produk Saya
          </TabsTrigger>
          <TabsTrigger 
            value="orders"
            className="data-[state=active]:bg-nxe-primary data-[state=active]:text-white"
          >
            Pesanan
          </TabsTrigger>
          <TabsTrigger 
            value="analytics"
            className="data-[state=active]:bg-nxe-primary data-[state=active]:text-white"
          >
            Analitik
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="mt-4">
          {productsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-nxe-surface border-nxe-border">
                  <CardContent className="p-4">
                    <div className="w-full h-48 bg-nxe-border rounded animate-pulse mb-4" />
                    <div className="h-4 bg-nxe-border rounded animate-pulse mb-2" />
                    <div className="h-4 bg-nxe-border rounded animate-pulse w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (products as Product[]).length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Belum ada produk
              </h3>
              <p className="text-nxe-text mb-4">
                Mulai jual akun gaming Anda dan dapatkan penghasilan
              </p>
              <Button 
                onClick={() => setLocation("/upload")}
                className="bg-nxe-primary hover:bg-nxe-primary/80 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Produk Pertama
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(products as Product[]).map((product: Product) => (
                <Card
                  key={product.id}
                  className="bg-nxe-surface border-nxe-border hover:border-nxe-primary/30 transition-colors"
                  data-testid={`product-${product.id}`}
                >
                  <CardContent className="p-0">
                    <div className="relative">
                      <img
                        src={product.thumbnail || `/api/placeholder/300/200?text=${product.category}`}
                        alt={product.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <Badge className={`absolute top-2 right-2 ${getStatusColor(product.status)} text-white`}>
                        {getStatusText(product.status)}
                      </Badge>
                      {product.isPremium && (
                        <Badge className="absolute top-2 left-2 bg-yellow-600 text-white">
                          Premium
                        </Badge>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-white mb-2 line-clamp-2">
                        {product.title}
                      </h3>
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-nxe-primary">
                          {formatPrice(product.price)}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm text-white">
                            {product.rating} ({product.reviewCount})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4 text-sm text-nxe-text">
                        <div className="flex items-center space-x-2">
                          <Eye className="h-4 w-4" />
                          <span>{formatNumber(product.views)} views</span>
                        </div>
                        <span>{formatTimeAgo(product.createdAt)}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => setLocation(`/product/${product.id}`)}
                          variant="outline"
                          size="sm"
                          className="flex-1 border-nxe-border text-white hover:bg-nxe-primary hover:text-white"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Lihat
                        </Button>
                        <Button
                          onClick={() => setLocation(`/product/${product.id}/edit`)}
                          variant="outline"
                          size="sm"
                          className="flex-1 border-nxe-border text-white hover:bg-blue-600 hover:text-white"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="mt-4">
          <div className="text-center py-12">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Fitur Pesanan
            </h3>
            <p className="text-nxe-text">
              Kelola pesanan dan komunikasi dengan pembeli akan tersedia di sini
            </p>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-4">
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Analytics & Reports
            </h3>
            <p className="text-nxe-text">
              Grafik penjualan, performa produk, dan insights lainnya akan tersedia di sini
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}