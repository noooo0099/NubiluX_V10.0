import { useState } from "react";
import { Wallet as WalletIcon, Plus, Minus, CreditCard, History, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Wallet() {
  const [topupAmount, setTopupAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const { toast } = useToast();

  const { data: walletData } = useQuery({
    queryKey: ["/api/wallet/balance"],
  });

  const balance = walletData?.balance || "0";

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

  return (
    <div className="min-h-screen bg-nxe-dark px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-6">My Wallet</h1>

      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-nxe-primary to-nxe-accent mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Total Balance</p>
              <p className="text-white text-3xl font-bold">
                {formatCurrency(balance)}
              </p>
            </div>
            <WalletIcon className="h-12 w-12 text-white/80" />
          </div>
        </CardContent>
      </Card>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Top-up */}
        <Card className="bg-nxe-card border-nxe-surface">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Plus className="h-5 w-5 text-green-500" />
              <span>Top-up Wallet</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTopup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topup" className="text-white">Amount (IDR)</Label>
                <Input
                  id="topup"
                  type="number"
                  placeholder="Minimum Rp 10,000"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  className="bg-nxe-surface border-nxe-surface text-white"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.slice(0, 3).map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTopupAmount(amount.toString())}
                    className="text-xs"
                  >
                    {formatCurrency(amount.toString())}
                  </Button>
                ))}
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
              >
                <QrCode className="h-4 w-4" />
                <span>Pay with QRIS</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Withdraw */}
        <Card className="bg-nxe-card border-nxe-surface">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Minus className="h-5 w-5 text-red-500" />
              <span>Withdraw</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="withdraw" className="text-white">Amount (IDR)</Label>
                <Input
                  id="withdraw"
                  type="number"
                  placeholder="Minimum Rp 50,000"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="bg-nxe-surface border-nxe-surface text-white"
                />
              </div>

              <div className="bg-nxe-surface p-3 rounded-lg">
                <p className="text-gray-400 text-sm">
                  Available: {formatCurrency(balance)}
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center space-x-2"
              >
                <CreditCard className="h-4 w-4" />
                <span>Withdraw to Bank</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="bg-nxe-card border-nxe-surface">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Transaction History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sampleTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 bg-nxe-surface rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getTransactionIcon(transaction.type)}
                  <div>
                    <p className="text-white text-sm font-medium">
                      {transaction.description}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`font-semibold ${
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
                    {transaction.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
