import { createContext, useContext, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Shield, Trash2, LogOut, XCircle } from 'lucide-react';

interface ConfirmationOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning';
  icon?: 'warning' | 'shield' | 'delete' | 'logout' | 'cancel';
}

interface ConfirmationContextValue {
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
}

const ConfirmationContext = createContext<ConfirmationContextValue | undefined>(undefined);

interface ConfirmationState extends ConfirmationOptions {
  open: boolean;
  resolve?: (value: boolean) => void;
}

export function ConfirmationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmationState>({
    open: false,
    title: '',
    description: '',
    confirmText: 'Konfirmasi',
    cancelText: 'Batal',
    variant: 'default',
  });

  const confirm = (options: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        ...options,
        confirmText: options.confirmText || 'Konfirmasi',
        cancelText: options.cancelText || 'Batal',
        variant: options.variant || 'default',
        open: true,
        resolve,
      });
    });
  };

  const handleConfirm = () => {
    if (state.resolve) {
      state.resolve(true);
    }
    setState(prev => ({ ...prev, open: false, resolve: undefined }));
  };

  const handleCancel = () => {
    if (state.resolve) {
      state.resolve(false);
    }
    setState(prev => ({ ...prev, open: false, resolve: undefined }));
  };

  const getIcon = () => {
    switch (state.icon) {
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-amber-500" />;
      case 'shield':
        return <Shield className="h-6 w-6 text-blue-500" />;
      case 'delete':
        return <Trash2 className="h-6 w-6 text-red-500" />;
      case 'logout':
        return <LogOut className="h-6 w-6 text-orange-500" />;
      case 'cancel':
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-amber-500" />;
    }
  };

  const getConfirmButtonVariant = () => {
    switch (state.variant) {
      case 'destructive':
        return 'destructive';
      case 'warning':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      <AlertDialog open={state.open} onOpenChange={handleCancel}>
        <AlertDialogContent className="sm:max-w-md" data-testid="confirmation-dialog">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              {getIcon()}
              <AlertDialogTitle data-testid="confirmation-title">
                {state.title}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription data-testid="confirmation-description" className="mt-2">
              {state.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <AlertDialogCancel 
              onClick={handleCancel}
              data-testid="button-cancel"
            >
              {state.cancelText}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={getConfirmButtonVariant() === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
              data-testid="button-confirm"
            >
              {state.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmationContext.Provider>
  );
}

export function useConfirmation() {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
}