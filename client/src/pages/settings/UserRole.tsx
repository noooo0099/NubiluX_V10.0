import { ArrowLeft, Shield, User, Store } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function UserRole() {
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<'buyer' | 'seller'>('buyer');
  const queryClient = useQueryClient();

  const updateRoleMutation = useMutation({
    mutationFn: (role: 'buyer' | 'seller') => 
      apiRequest('/api/users/update-role', {
        method: 'POST',
        body: JSON.stringify({ role }),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/profile'] });
      alert('Peran berhasil diperbarui!');
    }
  });

  const roles = [
    {
      id: 'buyer',
      title: 'Pembeli',
      description: 'Beli akun gaming dari penjual terpercaya',
      icon: User,
      features: [
        'Akses ke semua produk',
        'Chat dengan penjual',
        'Sistem escrow aman',
        'Rating dan review'
      ]
    },
    {
      id: 'seller',
      title: 'Penjual',
      description: 'Jual akun gaming Anda dengan mudah',
      icon: Store,
      features: [
        'Upload produk unlimited',
        'Dashboard analytics',
        'Manajemen pesanan',
        'Komisi kompetitif'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-nxe-dark">
      {/* Header */}
      <div className="sticky top-0 bg-nxe-surface border-b border-nxe-border z-10">
        <div className="flex items-center px-4 py-4">
          <button 
            onClick={() => setLocation('/settings')}
            className="p-2 hover:bg-nxe-card rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-nxe-text" />
          </button>
          <h1 className="text-lg font-semibold text-nxe-text ml-3">Peran Pengguna</h1>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-6 h-6 text-nxe-primary" />
            <h2 className="text-xl font-bold text-nxe-text">Pilih Peran Anda</h2>
          </div>
          <p className="text-nxe-text-secondary">
            Pilih peran yang sesuai dengan kebutuhan Anda. Anda dapat mengubahnya kapan saja.
          </p>
        </div>

        <div className="space-y-4">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            
            return (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role.id as 'buyer' | 'seller')}
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-nxe-primary bg-nxe-primary/5' 
                    : 'border-nxe-border bg-nxe-card hover:border-nxe-primary/50'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-full ${
                    isSelected ? 'bg-nxe-primary text-white' : 'bg-nxe-surface text-nxe-text-secondary'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-nxe-text mb-2">{role.title}</h3>
                    <p className="text-nxe-text-secondary mb-4">{role.description}</p>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-nxe-text text-sm">Fitur:</h4>
                      <ul className="space-y-1">
                        {role.features.map((feature, index) => (
                          <li key={index} className="text-sm text-nxe-text-secondary flex items-center">
                            <div className="w-1.5 h-1.5 bg-nxe-primary rounded-full mr-3"></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8">
          <button
            onClick={() => updateRoleMutation.mutate(selectedRole)}
            disabled={updateRoleMutation.isPending}
            className="w-full bg-nxe-primary hover:bg-nxe-primary/90 text-white py-3 px-6 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            {updateRoleMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </div>
  );
}