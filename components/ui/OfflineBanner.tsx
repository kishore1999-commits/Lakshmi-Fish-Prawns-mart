import React from 'react';
import { View, Text } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';

export function OfflineBanner() {
  const { isOnline } = useApp();

  if (isOnline) return null;

  return (
    <View className="bg-amber-500 px-4 py-2 flex-row items-center justify-center">
      <WifiOff size={16} color="#fff" />
      <Text className="text-white font-medium ml-2">
        You're offline. Some features may not work.
      </Text>
    </View>
  );
}
