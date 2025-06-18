import * as React from 'react';

interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  action?: React.ReactNode;
  onDismiss?: () => void;
}

export function Toast({ title, description, variant = 'default', action, onDismiss }: ToastProps) {
  const baseStyles = 'fixed top-4 right-4 z-50 w-full max-w-sm rounded-lg p-4 shadow-lg transition-all';
  const variantStyles = {
    default: 'bg-white text-gray-900 border border-gray-200',
    destructive: 'bg-red-500 text-white',
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium">{title}</h3>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-4 text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <span className="sr-only">Close</span>
            <span aria-hidden="true">×</span>
          </button>
        )}
      </div>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = React.useState<ToastProps | null>(null);

  const showToast = (props: ToastProps) => {
    setToast(props);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  const ToastContainer = () => {
    if (!toast) return null;
    return (
      <Toast 
        {...toast} 
        onDismiss={() => setToast(null)}
      />
    );
  };

  return { showToast, ToastContainer };
}
