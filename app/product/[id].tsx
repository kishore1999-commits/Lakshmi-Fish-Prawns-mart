import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Star, ShoppingCart, Check, Truck, AlertTriangle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useApp } from '@/contexts/AppContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { QuantitySelector } from '@/components/products/QuantitySelector';
import { AddToCartModal } from '@/components/cart/AddToCartModal';
import { useToast } from '@/components/ui/Toast';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart, items } = useCart();
  const { setShowAuthModal, setAuthModalMessage, selectedPinCode } = useApp();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(0.5);
  const [adding, setAdding] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [refreshingStock, setRefreshingStock] = useState(false);

  const fetchProduct = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, vendors(*), categories(*)')
      .eq('id', id)
      .maybeSingle();

    if (data) {
      setProduct(data as Product);
      setCurrentStock(data.stock_kg);
      setQuantity(data.min_order_kg);
    }
    setLoading(false);
  }, [id]);

  const refreshStock = useCallback(async () => {
    if (!id) return;

    setRefreshingStock(true);
    const { data } = await supabase
      .from('products')
      .select('stock_kg')
      .eq('id', id)
      .maybeSingle();

    if (data) {
      setCurrentStock(data.stock_kg);
      if (product) {
        setProduct({ ...product, stock_kg: data.stock_kg });
      }
    }
    setRefreshingStock(false);
  }, [id, product]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    const interval = setInterval(refreshStock, 30000);
    return () => clearInterval(interval);
  }, [refreshStock]);

  const cartItem = items.find((item) => item.product_id === product?.id);
  const quantityInCart = cartItem?.quantity_kg || 0;
  const availableToAdd = currentStock - quantityInCart;

  const handleAddToCart = async () => {
    if (!product) return;

    if (!user) {
      setAuthModalMessage('Sign in to add items to your cart');
      setShowAuthModal(true);
      return;
    }

    await refreshStock();

    const totalQuantity = quantityInCart + quantity;
    if (totalQuantity > currentStock) {
      const available = Math.max(0, currentStock - quantityInCart);
      if (available <= 0) {
        showToast('This item is already at maximum available stock in your cart', 'error');
      } else {
        showToast(`Only ${available.toFixed(1)} kg more available to add`, 'error');
      }
      return;
    }

    setAdding(true);
    const { error } = await addToCart(product.id, quantity);

    if (error) {
      showToast(error.message, 'error');
    } else {
      setShowSuccessModal(true);
    }
    setAdding(false);
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading product..." />;
  }

  if (!product) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Product not found</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="ghost" className="mt-4" />
        </View>
      </SafeAreaView>
    );
  }

  const isOutOfStock = currentStock <= 0;
  const totalPrice = product.price_per_kg * quantity;
  const maxAddable = Math.max(product.min_order_kg, availableToAdd);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
        >
          <ArrowLeft size={20} color="#374151" />
        </Pressable>
        <Text className="flex-1 text-lg font-semibold text-gray-800 ml-4" numberOfLines={1}>
          {product.name}
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="relative">
          <Image
            source={{ uri: product.image_url || 'https://images.pexels.com/photos/3296392/pexels-photo-3296392.jpeg?auto=compress&cs=tinysrgb&w=800' }}
            className="w-full h-72"
            resizeMode="cover"
          />

          {isOutOfStock && (
            <View className="absolute inset-0 bg-black/60 items-center justify-center">
              <View className="bg-red-500 px-6 py-3 rounded-xl">
                <Text className="text-white font-bold text-lg">Out of Stock</Text>
              </View>
            </View>
          )}
        </View>

        <View className="p-4">
          <View className="flex-row items-center mb-2">
            <Text className="text-sky-600 text-sm font-medium">
              {product.vendors?.name}
            </Text>
            {product.vendors?.rating && (
              <View className="flex-row items-center ml-2 bg-green-50 px-2 py-1 rounded-lg">
                <Star size={12} color="#22c55e" fill="#22c55e" />
                <Text className="text-green-700 text-xs font-semibold ml-1">
                  {product.vendors.rating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>

          <Text className="text-2xl font-bold text-gray-800 mb-2">
            {product.name}
          </Text>

          <View className="flex-row items-baseline mb-4">
            <Text className="text-3xl font-bold text-sky-600">
              Rs.{product.price_per_kg.toFixed(0)}
            </Text>
            <Text className="text-gray-500 ml-1">/kg</Text>
          </View>

          {!isOutOfStock ? (
            <View className="bg-green-50 border border-green-200 rounded-xl p-3 flex-row items-center mb-4">
              <Check size={18} color="#22c55e" />
              <View className="ml-2 flex-1">
                <Text className="text-green-700 font-medium">
                  {currentStock.toFixed(1)} kg available
                </Text>
                {quantityInCart > 0 && (
                  <Text className="text-green-600 text-xs mt-0.5">
                    ({quantityInCart.toFixed(1)} kg already in cart)
                  </Text>
                )}
              </View>
              {refreshingStock && (
                <Text className="text-green-600 text-xs">Updating...</Text>
              )}
            </View>
          ) : (
            <View className="bg-red-50 border border-red-200 rounded-xl p-3 flex-row items-center mb-4">
              <AlertTriangle size={18} color="#ef4444" />
              <Text className="text-red-700 ml-2 font-medium">
                Currently out of stock
              </Text>
            </View>
          )}

          {availableToAdd <= 0 && !isOutOfStock && (
            <View className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex-row items-center mb-4">
              <AlertTriangle size={18} color="#f59e0b" />
              <Text className="text-amber-700 ml-2">
                Maximum available quantity already in cart
              </Text>
            </View>
          )}

          {selectedPinCode && (
            <View className="bg-sky-50 border border-sky-200 rounded-xl p-3 flex-row items-center mb-4">
              <Truck size={18} color="#0ea5e9" />
              <Text className="text-sky-700 ml-2">
                Expected delivery: Tomorrow
              </Text>
            </View>
          )}

          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-2">
              Description
            </Text>
            <Text className="text-gray-600 leading-6">
              {product.description || 'Fresh seafood sourced directly from trusted fishermen. Cleaned and ready to cook.'}
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-2">
              Category
            </Text>
            <View className="bg-gray-100 self-start px-3 py-2 rounded-lg">
              <Text className="text-gray-700">
                {product.categories?.name || 'Seafood'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {!isOutOfStock && availableToAdd > 0 && (
        <View className="p-4 bg-white border-t border-gray-100">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-gray-500 text-sm">Select Quantity</Text>
              <Text className="text-gray-400 text-xs">
                Max: {Math.min(maxAddable, currentStock).toFixed(1)} kg
              </Text>
            </View>
            <QuantitySelector
              value={quantity}
              onChange={setQuantity}
              min={product.min_order_kg}
              max={Math.min(maxAddable, currentStock)}
            />
          </View>

          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-gray-600">Total</Text>
            <Text className="text-2xl font-bold text-gray-800">
              Rs.{totalPrice.toFixed(0)}
            </Text>
          </View>

          <Button
            title={cartItem ? 'Add More to Cart' : 'Add to Cart'}
            onPress={handleAddToCart}
            loading={adding}
            icon={<ShoppingCart size={20} color="#fff" />}
            size="lg"
            className="w-full"
          />
        </View>
      )}

      <AddToCartModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        productName={product.name}
        productImage={product.image_url || undefined}
        quantity={quantity}
        total={totalPrice}
      />
    </SafeAreaView>
  );
}
