import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '@/lib/supabase';
import { DeliveryPinCode } from '@/types/database';

interface AppContextType {
  isOnline: boolean;
  selectedPinCode: string | null;
  deliveryInfo: DeliveryPinCode | null;
  setPinCode: (pinCode: string) => Promise<{ valid: boolean; info?: DeliveryPinCode }>;
  clearPinCode: () => Promise<void>;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  authModalMessage: string;
  setAuthModalMessage: (message: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const PIN_CODE_KEY = '@freshsea_pincode';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [selectedPinCode, setSelectedPinCode] = useState<string | null>(null);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryPinCode | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState('');

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
    });

    loadSavedPinCode();
    return () => unsubscribe();
  }, []);

  const loadSavedPinCode = async () => {
    try {
      const saved = await AsyncStorage.getItem(PIN_CODE_KEY);
      if (saved) {
        const { pinCode, info } = JSON.parse(saved);
        setSelectedPinCode(pinCode);
        setDeliveryInfo(info);
      }
    } catch (error) {
      console.error('Error loading pin code:', error);
    }
  };

  const setPinCode = async (pinCode: string): Promise<{ valid: boolean; info?: DeliveryPinCode }> => {
    try {
      const { data, error } = await supabase
        .from('delivery_pin_codes')
        .select('*')
        .eq('pin_code', pinCode)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        return { valid: false };
      }

      setSelectedPinCode(pinCode);
      setDeliveryInfo(data);

      await AsyncStorage.setItem(PIN_CODE_KEY, JSON.stringify({
        pinCode,
        info: data,
      }));

      return { valid: true, info: data };
    } catch (error) {
      return { valid: false };
    }
  };

  const clearPinCode = async () => {
    setSelectedPinCode(null);
    setDeliveryInfo(null);
    await AsyncStorage.removeItem(PIN_CODE_KEY);
  };

  return (
    <AppContext.Provider value={{
      isOnline,
      selectedPinCode,
      deliveryInfo,
      setPinCode,
      clearPinCode,
      showAuthModal,
      setShowAuthModal,
      authModalMessage,
      setAuthModalMessage,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
