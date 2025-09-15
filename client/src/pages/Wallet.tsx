import { useState } from "react";
import { Wallet as WalletIcon, Plus, Minus, CreditCard, History, QrCode, Send, ShoppingBag, Gamepad2, Gift, Star, ArrowUpDown, Download, Smartphone, Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Wallet() {
  const [topupAmount, setTopupAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const { toast } = useToast();

  const { data: walletData } = useQuery({
    queryKey: ["/api/wallet/balance"],
  });

  const balance = (walletData as any)?.balance || "0";

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(parseInt(amount));
  };

  const handleTopup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topupAmount || parseInt(topupAmount) < 10000) {
      toast({
        title: "Invalid amount",
        description: "Minimum top-up amount is Rp 10,000",
        variant: "destructive",
      });
      return;
    }
    
    // Implement QRIS payment
    toast({
      title: "QRIS Payment",
      description: "Please scan the QR code to complete payment",
    });
    setTopupAmount("");
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || parseInt(withdrawAmount) < 50000) {
      toast({
        title: "Invalid amount",
        description: "Minimum withdrawal amount is Rp 50,000",
        variant: "destructive",
      });
      return;
    }

    if (parseInt(withdrawAmount) > parseInt(balance)) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough balance for this withdrawal",
        variant: "destructive",
      });
      return;
    }

    // Implement withdrawal
    toast({
      title: "Withdrawal requested",
      description: "Your withdrawal request is being processed",
    });
    setWithdrawAmount("");
  };

  const quickAmounts = [50000, 100000, 250000, 500000, 1000000];

  const sampleTransactions = [
    {
      id: 1,
      type: "topup",
      amount: "500000",
      description: "Wallet top-up via QRIS",
      date: "2024-01-15",
      status: "completed"
    },
    {
      id: 2,
      type: "payment",
      amount: "-250000",
      description: "Purchase: Mobile Legends Account",
      date: "2024-01-14",
      status: "completed"
    },
    {
      id: 3,
      type: "commission",
      amount: "25000",
      description: "Sale commission: PUBG Account",
      date: "2024-01-13",
      status: "completed"
    },
    {
      id: 4,
      type: "withdrawal",
      amount: "-100000",
      description: "Withdrawal to bank account",
      date: "2024-01-12",
      status: "pending"
    }
  ];

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "topup":
        return <Plus className="h-4 w-4 text-green-500" />;
      case "payment":
      case "withdrawal":
        return <Minus className="h-4 w-4 text-red-500" />;
      case "commission":
        return <WalletIcon className="h-4 w-4 text-nxe-accent" />;
      default:
        return <WalletIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const quickActions = [
    { id: 'topup', label: 'Isi Saldo', icon: Plus, color: 'text-green-500' },
    { id: 'send', label: 'Kirim', icon: Send, color: 'text-blue-500' },
    { id: 'withdraw', label: 'Tarik', icon: Download, color: 'text-orange-500' },
    { id: 'request', label: 'Minta', icon: ArrowUpDown, color: 'text-purple-500' },
  ];

  const services = [
    { id: 'pulsa', label: 'Pulsa & Data', icon: Smartphone, color: 'text-red-500' },
    { id: 'deals', label: 'NXE Deals', icon: ShoppingBag, color: 'text-yellow-500' },
    { id: 'rewards', label: 'A+ Rewards', icon: Star, color: 'text-blue-500' },
    { id: 'games', label: 'Gaming Zone', icon: Gamepad2, color: 'text-purple-500' },
    { id: 'promo', label: 'Promo s.d 80%', icon: Gift, color: 'text-orange-500' },
    { id: 'qris', label: 'DANA QRISFEST', icon: QrCode, color: 'text-green-500' },
    { id: 'electric', label: 'Listrik', icon: Zap, color: 'text-yellow-400' },
    { id: 'more', label: 'Lihat Semua', icon: Plus, color: 'text-gray-400' },
  ];

  return (
    <div className="min-h-screen bg-nxe-dark">
      {/* Header with Balance */}
      <div className="bg-gradient-to-b from-nxe-primary via-nxe-primary to-nxe-primary/90 px-4 pt-8 pb-16 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-8 -translate-x-4"></div>
        
        {/* Balance Card */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <WalletIcon className="h-6 w-6 text-nxe-primary" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Saldo NXE</p>
                <p className="text-white text-xs">Bisa Nambah Tiap Hari</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-white/80 hover:bg-white/10" data-testid="button-scan-qr">
              <QrCode className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <p className="text-white text-3xl font-bold mb-1" data-testid="text-balance">
              {formatCurrency(balance)}
            </p>
            <p className="text-white/80 text-sm">
              💎 {parseInt(balance) > 0 ? 'Bisa Nambah Tiap Hari' : 'Ayo isi saldo untuk mulai transaksi'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 -mt-8 relative z-20 mb-6">
        <div className="bg-nxe-card rounded-2xl p-4 border border-nxe-surface shadow-lg">
          <div className="grid grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="ghost"
                className="flex flex-col items-center space-y-2 h-16 hover:bg-nxe-surface/50"
                onClick={() => {
                  switch(action.id) {
                    case 'topup':
                      handleQuickTopup();
                      break;
                    case 'withdraw':
                      setShowWithdrawDialog(true);
                      break;
                    case 'send':
                      setShowSendDialog(true);
                      break;
                    case 'request':
                      toast({
                        title: "Fitur Minta Saldo",
                        description: "Fitur ini akan segera hadir!",
                      });
                      break;
                  }
                }}
                data-testid={`button-${action.id}`}
              >
                <div className={`w-8 h-8 rounded-full bg-nxe-surface flex items-center justify-center ${action.color}`}>
                  <action.icon className="h-4 w-4" />
                </div>
                <span className="text-white text-xs font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="px-4 mb-6">
        <h3 className="text-white font-semibold mb-4">Layanan Favorit</h3>
        <div className="grid grid-cols-4 gap-4">
          {services.map((service) => (
            <Button
              key={service.id}
              variant="ghost"
              className="flex flex-col items-center space-y-2 h-20 hover:bg-nxe-surface/30 rounded-xl"
              data-testid={`service-${service.id}`}
            >
              <div className={`w-10 h-10 rounded-xl bg-nxe-surface flex items-center justify-center ${service.color}`}>
                <service.icon className="h-5 w-5" />
              </div>
              <span className="text-white text-xs text-center leading-tight">{service.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Aktivitas Terbaru</h3>
          <Button variant="ghost" size="sm" className="text-nxe-primary hover:bg-nxe-surface/30" data-testid="button-view-all">
            Lihat Semua
          </Button>
        </div>
        
        <div className="space-y-3">
          {sampleTransactions.slice(0, 3).map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 bg-nxe-card rounded-xl border border-nxe-surface"
              data-testid={`transaction-${transaction.id}`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-nxe-surface rounded-xl flex items-center justify-center">
                  {getTransactionIcon(transaction.type)}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">
                    {transaction.description}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {new Date(transaction.date).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className={`font-semibold text-sm ${
                  transaction.amount.startsWith('-') 
                    ? 'text-red-400' 
                    : 'text-green-400'
                }`}>
                  {transaction.amount.startsWith('-') ? '' : '+'}
                  {formatCurrency(transaction.amount.replace('-', ''))}
                </p>
                <p className={`text-xs ${
                  transaction.status === 'completed' 
                    ? 'text-green-400' 
                    : 'text-yellow-400'
                }`}>
                  {transaction.status === 'completed' ? 'Berhasil' : 'Pending'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="bg-nxe-card border-nxe-surface text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-white">
              <Download className="h-5 w-5 text-orange-500" />
              <span>Tarik Saldo</span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { handleWithdraw(e); setShowWithdrawDialog(false); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount" className="text-white">Jumlah Penarikan (IDR)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                placeholder="Minimum Rp 50,000"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="bg-nxe-surface border-nxe-surface text-white h-12"
                data-testid="input-withdraw-amount"
              />
            </div>

            <div className="bg-nxe-surface p-3 rounded-lg">
              <p className="text-gray-400 text-sm">
                Saldo tersedia: {formatCurrency(balance)}
              </p>
            </div>

            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowWithdrawDialog(false)}
                className="flex-1 bg-transparent border-nxe-surface text-white hover:bg-nxe-surface"
                data-testid="button-cancel-withdraw"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                data-testid="button-confirm-withdraw"
              >
                Tarik Saldo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Send Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="bg-nxe-card border-nxe-surface text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-white">
              <Send className="h-5 w-5 text-blue-500" />
              <span>Kirim Saldo</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-gray-400 mb-4">
              Fitur kirim saldo akan segera hadir! 
            </p>
            <p className="text-center text-sm text-gray-500">
              Anda akan dapat mengirim saldo ke sesama pengguna NXE
            </p>
          </div>
          <Button
            onClick={() => setShowSendDialog(false)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="button-close-send"
          >
            Mengerti
          </Button>
        </DialogContent>
      </Dialog>

      {/* Hidden forms for functionality */}
      <div className="hidden">
        <form onSubmit={handleTopup}>
          <Input
            type="number"
            value={topupAmount}
            onChange={(e) => setTopupAmount(e.target.value)}
            placeholder="Amount"
          />
        </form>
      </div>
    </div>
  );

  function handleQuickTopup() {
    // Quick topup with preset amount
    setTopupAmount("100000");
    const formData = new FormData();
    formData.append('amount', '100000');
    toast({
      title: "QRIS Payment",
      description: "Silakan scan QR code untuk menyelesaikan pembayaran Rp 100,000",
    });
  }
}
