import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ShoppingCart, ArrowRight, Trash2, AlertTriangle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { CartItemCard } from '@/components/cart/CartItemCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';

export default function CartScreen() {
  const router = useRouter();
  const { items, loading, subtotal, clearCart, refreshCart } = useCart();
  const { user } = useAuth();
  const { setShowAuthModal, setAuthModalMessage, selectedPinCode } = useApp();
  const { showToast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [stockIssues, setStockIssues] = useState<string[]>([]);

  const checkAllStock = useCallback(async () => {
    if (items.length === 0) {
      setStockIssues([]);
      return;
    }

    const issues: string[] = [];
    for (const item of items) {
      const { data } = await supabase
        .from('products')
        .select('stock_kg, name')
        .eq('id', item.product_id)
        .maybeSingle();

      if (data) {
        if (data.stock_kg <= 0) {
          issues.push(`${data.name} is out of stock`);
        } else if (item.quantity_kg > data.stock_kg) {
          issues.push(`${data.name}: only ${data.stock_kg.toFixed(1)} kg available`);
        }
      }
    }
    setStockIssues(issues);
  }, [items]);

  useFocusEffect(
    useCallback(() => {
      refreshCart();
      checkAllStock();
    }, [refreshCart, checkAllStock])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshCart();
    await checkAllStock();
    setRefreshing(false);
  };

  const handleCheckout = async () => {
    if (!user) {
      setAuthModalMessage('Please sign in to proceed to checkout');
      setShowAuthModal(true);
      return;
    }

    if (!selectedPinCode) {
      showToast('Please select a delivery location first', 'error');
      return;
    }

    await checkAllStock();

    if (stockIssues.length > 0) {
      showToast('Please resolve stock issues before checkout', 'error');
      return;
    }

    router.push('/checkout');
  };

  const handleClearCart = async () => {
    await clearCart();
    setStockIssues([]);
    showToast('Cart cleared', 'success');
  };

  const handleContinueShopping = () => {
    router.push('/(tabs)/');
  };

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <View className="px-4 py-4 bg-white border-b border-gray-100">
          <Text className="text-2xl font-bold text-gray-800">Cart</Text>
        </View>
        <EmptyState
          icon={<ShoppingCart size={40} color="#0ea5e9" />}
          title="Sign in to view cart"
          message="Please sign in to add items to your cart and checkout"
          actionTitle="Sign In"
          onAction={() => {
            setAuthModalMessage('Sign in to access your cart');
            setShowAuthModal(true);
          }}
        />
      </SafeAreaView>
    );
  }

  if (loading && items.length === 0) {
    return <LoadingSpinner fullScreen message="Loading cart..." />;
  }

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <View className="px-4 py-4 bg-white border-b border-gray-100">
          <Text className="text-2xl font-bold text-gray-800">Cart</Text>
        </View>
        <EmptyState
          icon={<ShoppingCart size={40} color="#0ea5e9" />}
          title="Your cart is empty"
          message="Add some fresh seafood to get started"
          actionTitle="Browse Products"
          onAction={handleContinueShopping}
        />
      </SafeAreaView>
    );
  }

  const hasStockIssues = stockIssues.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="px-4 py-4 bg-white border-b border-gray-100 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-gray-800">Cart</Text>
          <Text className="text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''}</Text>
        </View>
        <Pressable
          onPress={handleClearCart}
          className="flex-row items-center bg-red-50 px-3 py-2 rounded-lg"
        >
          <Trash2 size={16} color="#ef4444" />
          <Text className="text-red-600 font-medium ml-1">Clear All</Text>
        </Pressable>
      </View>

      {hasStockIssues && (
        <View className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <View className="flex-row items-center mb-2">
            <AlertTriangle size={18} color="#f59e0b" />
            <Text className="text-amber-800 font-semibold ml-2">Stock Issues</Text>
          </View>
          {stockIssues.map((issue, index) => (
            <Text key={index} className="text-amber-700 text-sm">
              - {issue}
            </Text>
          ))}
          <Text className="text-amber-600 text-xs mt-2">
            Please adjust quantities or remove items before checkout
          </Text>
        </View>
      )}

      <ScrollView
        className="flex-1 p-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {items.map((item) => (
          <CartItemCard key={item.id} item={item} />
        ))}
      </ScrollView>

      <View className="p-4 bg-white border-t border-gray-100">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-gray-600">Subtotal</Text>
          <Text className="text-2xl font-bold text-gray-800">
            Rs.{subtotal.toFixed(0)}
          </Text>
        </View>

        <Button
          title="Proceed to Checkout"
          onPress={handleCheckout}
          icon={<ArrowRight size={20} color="#fff" />}
          size="lg"
          disabled={hasStockIssues}
          className="w-full"
        />

        {hasStockIssues && (
          <Text className="text-center text-red-500 text-xs mt-2">
            Resolve stock issues to continue
          </Text>
        )}

        <Button
          title="Continue Shopping"
          onPress={handleContinueShopping}
          variant="ghost"
          className="w-full mt-2"
        />
      </View>
    </SafeAreaView>
  );
}
