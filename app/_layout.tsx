import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { AppProvider } from '@/contexts/AppContext';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthModal } from '@/components/auth/AuthModal';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { View } from 'react-native';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <AppProvider>
        <CartProvider>
          <ToastProvider>
            <View className="flex-1 bg-white">
              <OfflineBanner />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="product/[id]"
                  options={{
                    presentation: 'card',
                    animation: 'slide_from_right',
                  }}
                />
                <Stack.Screen
                  name="category/[slug]"
                  options={{
                    presentation: 'card',
                    animation: 'slide_from_right',
                  }}
                />
                <Stack.Screen
                  name="checkout"
                  options={{
                    presentation: 'card',
                    animation: 'slide_from_bottom',
                  }}
                />
                <Stack.Screen
                  name="order/[id]"
                  options={{
                    presentation: 'card',
                    animation: 'slide_from_right',
                  }}
                />
                <Stack.Screen name="+not-found" />
              </Stack>
              <AuthModal />
            </View>
            <StatusBar style="auto" />
          </ToastProvider>
        </CartProvider>
      </AppProvider>
    </AuthProvider>
  );
}
