import { useState } from "react";
import { ChevronRight, CreditCard, Plus, Trash2, Shield, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'ewallet';
  name: string;
  details: string;
  isDefault: boolean;
  isVerified: boolean;
  expiresAt?: string;
}

export default function PaymentManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [paymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      name: 'Kartu Kredit BCA',
      details: '**** **** **** 1234',
      isDefault: true,
      isVerified: true,
      expiresAt: '12/25'
    },
    {
      id: '2',
      type: 'ewallet',
      name: 'GoPay',
      details: '+62 812-3456-7890',
      isDefault: false,
      isVerified: true
    },
    {
      id: '3',
      type: 'bank',
      name: 'Bank Mandiri',
      details: '****-****-1234',
      isDefault: false,
      isVerified: false
    }
  ]);

  const handleBackClick = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/settings");
    }
  };

  const handleAddPaymentMethod = () => {
    toast({
      title: "Tambah metode pembayaran",
      description: "Fitur akan diarahkan ke halaman verifikasi pembayaran.",
    });
  };

  const handleSetDefault = (methodId: string) => {
    toast({
      title: "Metode pembayaran utama diubah",
      description: "Metode pembayaran utama telah diperbarui.",
    });
  };

  const handleRemoveMethod = (methodId: string) => {
    toast({
      title: "Konfirmasi diperlukan",
      description: "Anda yakin ingin menghapus metode pembayaran ini?",
      variant: "destructive"
    });
  };

  const handleVerifyMethod = (methodId: string) => {
    toast({
      title: "Verifikasi dimulai",
      description: "Silakan ikuti instruksi verifikasi yang dikirimkan.",
    });
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'card':
        return <CreditCard className="h-5 w-5" />;
      case 'bank':
        return <Shield className="h-5 w-5" />;
      case 'ewallet':
        return <CreditCard className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'card':
        return 'Kartu';
      case 'bank':
        return 'Bank';
      case 'ewallet':
        return 'E-Wallet';
      default:
        return 'Lainnya';
    }
  };

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
        <h1 className="text-xl font-semibold text-white">Kelola Pembayaran</h1>
        <div className="w-6 h-6" /> {/* Spacer */}
      </div>

      {/* Add Payment Method */}
      <Card className="bg-nxe-card border-nxe-surface/30 mb-6">
        <CardContent className="p-4">
          <Button
            onClick={handleAddPaymentMethod}
            className="w-full bg-nxe-primary hover:bg-nxe-primary/90 text-white font-medium"
            data-testid="button-add-payment-method"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Metode Pembayaran
          </Button>
        </CardContent>
      </Card>

      {/* Payment Methods List */}
      <Card className="bg-nxe-card border-nxe-surface/30">
        <CardHeader className="pb-4">
          <CardTitle className="text-white text-lg">Metode Pembayaran Tersimpan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className="p-4 bg-nxe-surface rounded-lg border border-nxe-border"
              data-testid={`payment-method-${method.id}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-nxe-primary/20 rounded-lg text-nxe-primary">
                    {getMethodIcon(method.type)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-white font-medium">{method.name}</h3>
                      {method.isDefault && (
                        <Badge variant="secondary" className="bg-nxe-primary/20 text-nxe-primary">
                          Utama
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">{method.details}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(method.type)}
                      </Badge>
                      {method.expiresAt && (
                        <Badge variant="outline" className="text-xs flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{method.expiresAt}</span>
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  {method.isVerified ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Button
                      onClick={() => handleVerifyMethod(method.id)}
                      variant="outline"
                      size="sm"
                      className="text-yellow-400 border-yellow-400 hover:bg-yellow-400/10"
                      data-testid={`button-verify-${method.id}`}
                    >
                      Verifikasi
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {!method.isDefault && (
                    <Button
                      onClick={() => handleSetDefault(method.id)}
                      variant="outline"
                      size="sm"
                      className="text-nxe-primary border-nxe-primary hover:bg-nxe-primary/10"
                      data-testid={`button-set-default-${method.id}`}
                    >
                      Jadikan Utama
                    </Button>
                  )}
                </div>
                <Button
                  onClick={() => handleRemoveMethod(method.id)}
                  variant="outline"
                  size="sm"
                  className="text-red-400 border-red-600 hover:bg-red-600/10"
                  data-testid={`button-remove-${method.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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
              <h3 className="text-white font-medium mb-2">Keamanan Pembayaran</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Semua metode pembayaran menggunakan enkripsi tingkat bank dan disimpan dengan aman. 
                Data kartu kredit tidak pernah disimpan di server kami.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}