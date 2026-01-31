import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, Animated, Pressable } from 'react-native';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react-native';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} color="#22c55e" />;
      case 'error':
        return <AlertCircle size={20} color="#ef4444" />;
      default:
        return <Info size={20} color="#0ea5e9" />;
    }
  };

  const getColors = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-sky-50 border-sky-200';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View className="absolute top-16 left-4 right-4 z-50">
        {toasts.map((toast) => (
          <View
            key={toast.id}
            className={`flex-row items-center p-4 mb-2 rounded-xl border ${getColors(toast.type)} shadow-lg`}
          >
            {getIcon(toast.type)}
            <Text className="flex-1 ml-3 text-gray-800 font-medium">
              {toast.message}
            </Text>
            <Pressable onPress={() => removeToast(toast.id)} className="p-1">
              <X size={18} color="#6b7280" />
            </Pressable>
          </View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
