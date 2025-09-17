import { useState } from "react";
import { ChevronRight, Wallet, Plus, Link2, Unlink, Shield, RefreshCw, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface EWallet {
  id: string;
  name: string;
  balance: number;
  isConnected: boolean;
  phoneNumber?: string;
  email?: string;
  isVerified: boolean;
  logo: string;
}

export default function EWalletSettings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showBalance, setShowBalance] = useState(false);
  const [autoTopUp, setAutoTopUp] = useState(false);
  const [minBalance] = useState(50000);
  const [eWallets, setEWallets] = useState<EWallet[]>([
    {
      id: 'gopay',
      name: 'GoPay',
      balance: 125000,
      isConnected: true,
      phoneNumber: '+62 812-3456-7890',
      isVerified: true,
      logo: '🟢'
    },
    {
      id: 'ovo',
      name: 'OVO',
      balance: 0,
      isConnected: false,
      isVerified: false,
      logo: '🟣'
    },
    {
      id: 'dana',
      name: 'DANA',
      balance: 75000,
      isConnected: true,
      phoneNumber: '+62 812-3456-7890',
      isVerified: true,
      logo: '🔵'
    },
    {
      id: 'shopeepay',
      name: 'ShopeePay',
      balance: 0,
      isConnected: false,
      isVerified: false,
      logo: '🟠'
    }
  ]);

  const handleBackClick = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/settings");
    }
  };

  const handleConnect = (walletId: string) => {
    setEWallets(prev => prev.map(wallet => 
      wallet.id === walletId 
        ? { ...wallet, isConnected: true }
        : wallet
    ));
    toast({
      title: "E-Wallet terhubung",
      description: "Silakan verifikasi nomor telepon Anda untuk melanjutkan.",
    });
  };

  const handleDisconnect = (walletId: string) => {
    setEWallets(prev => prev.map(wallet => 
      wallet.id === walletId 
        ? { ...wallet, isConnected: false, isVerified: false }
        : wallet
    ));
    toast({
      title: "E-Wallet terputus",
      description: "Koneksi e-wallet telah diputuskan.",
      variant: "destructive"
    });
  };

  const handleRefreshBalance = (walletId: string) => {
    toast({
      title: "Saldo diperbarui",
      description: "Saldo e-wallet telah diperbarui dari server.",
    });
  };

  const handleVerify = (walletId: string) => {
    toast({
      title: "Verifikasi dimulai",
      description: "Kode verifikasi telah dikirim ke nomor telepon terdaftar.",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalBalance = eWallets
    .filter(wallet => wallet.isConnected)
    .reduce((sum, wallet) => sum + wallet.balance, 0);

  return (
    <div className="mobile-viewport-fix keyboard-smooth bg-nxe-dark px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={handleBackClick}
          className="text-nxe-text hover:text-nxe-primary transition-colors duration-200"
          data-testid="button-back"
        >
          <ChevronRight className="h-6 w-6 rotate-180" />
        </button>
        <h1 className="text-xl font-semibold text-white">E-Wallet Settings</h1>
        <div className="w-6 h-6" /> {/* Spacer */}
      </div>

      {/* Balance Overview */}
      <Card className="bg-nxe-card border-nxe-surface/30 mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Wallet className="h-6 w-6 text-nxe-primary" />
              <CardTitle className="text-white text-lg">Total Saldo E-Wallet</CardTitle>
            </div>
            <Button
              onClick={() => setShowBalance(!showBalance)}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
              data-testid="button-toggle-balance"
            >
              {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-3xl font-bold text-nxe-primary">
              {showBalance ? formatCurrency(totalBalance) : '••••••••'}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Dari {eWallets.filter(w => w.isConnected).length} e-wallet terhubung
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Auto Top-up Settings */}
      <Card className="bg-nxe-card border-nxe-surface/30 mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-white text-lg">Pengaturan Top-up Otomatis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white font-medium">Top-up Otomatis</Label>
              <p className="text-sm text-gray-400">Top-up saat saldo di bawah minimum</p>
            </div>
            <Switch
              checked={autoTopUp}
              onCheckedChange={setAutoTopUp}
              data-testid="switch-auto-topup"
            />
          </div>
          
          {autoTopUp && (
            <div className="space-y-2">
              <Label className="text-gray-200">Saldo Minimum</Label>
              <Input
                type="number"
                value={minBalance}
                className="bg-nxe-surface border-nxe-border text-white"
                placeholder="50000"
                data-testid="input-min-balance"
              />
              <p className="text-xs text-gray-500">
                Top-up otomatis akan dilakukan saat saldo di bawah jumlah ini
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* E-Wallet Connections */}
      <Card className="bg-nxe-card border-nxe-surface/30">
        <CardHeader className="pb-4">
          <CardTitle className="text-white text-lg">E-Wallet Terdaftar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {eWallets.map((wallet) => (
            <div
              key={wallet.id}
              className="p-4 bg-nxe-surface rounded-lg border border-nxe-border"
              data-testid={`ewallet-${wallet.id}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {wallet.logo}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-white font-medium">{wallet.name}</h3>
                      {wallet.isConnected && (
                        <Badge variant="secondary" className="bg-green-600/20 text-green-400">
                          Terhubung
                        </Badge>
                      )}
                    </div>
                    {wallet.phoneNumber && (
                      <p className="text-gray-400 text-sm">{wallet.phoneNumber}</p>
                    )}
                    <div className="flex items-center space-x-2 mt-1">
                      {wallet.isConnected && (
                        <p className="text-nxe-primary font-medium text-sm">
                          {showBalance ? formatCurrency(wallet.balance) : '••••••'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {wallet.isConnected && (
                  <Button
                    onClick={() => handleRefreshBalance(wallet.id)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                    data-testid={`button-refresh-${wallet.id}`}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {wallet.isConnected ? (
                    <>
                      {!wallet.isVerified && (
                        <Button
                          onClick={() => handleVerify(wallet.id)}
                          variant="outline"
                          size="sm"
                          className="text-yellow-400 border-yellow-400 hover:bg-yellow-400/10"
                          data-testid={`button-verify-${wallet.id}`}
                        >
                          <Shield className="h-4 w-4 mr-1" />
                          Verifikasi
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      onClick={() => handleConnect(wallet.id)}
                      variant="outline"
                      size="sm"
                      className="text-nxe-primary border-nxe-primary hover:bg-nxe-primary/10"
                      data-testid={`button-connect-${wallet.id}`}
                    >
                      <Link2 className="h-4 w-4 mr-1" />
                      Hubungkan
                    </Button>
                  )}
                </div>
                
                {wallet.isConnected && (
                  <Button
                    onClick={() => handleDisconnect(wallet.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-400 border-red-600 hover:bg-red-600/10"
                    data-testid={`button-disconnect-${wallet.id}`}
                  >
                    <Unlink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="bg-nxe-card border-nxe-surface/30 mt-6">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-nxe-primary mt-1" />
            <div>
              <h3 className="text-white font-medium mb-2">Keamanan E-Wallet</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Koneksi e-wallet menggunakan protokol keamanan tingkat bank. 
                Data sensitif tidak disimpan dan hanya digunakan untuk transaksi yang sah.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}