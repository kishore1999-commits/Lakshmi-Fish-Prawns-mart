import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, Pressable, ActivityIndicator } from 'react-native';
import { Trash2, AlertTriangle, RefreshCw } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { CartItem } from '@/types/database';
import { QuantitySelector } from '@/components/products/QuantitySelector';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/components/ui/Toast';

interface CartItemCardProps {
  item: CartItem;
}

export function CartItemCard({ item }: CartItemCardProps) {
  const { updateQuantity, removeFromCart } = useCart();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentStock, setCurrentStock] = useState<number>(item.products?.stock_kg || 0);
  const [checkingStock, setCheckingStock] = useState(false);

  const product = item.products;

  const refreshStock = useCallback(async () => {
    if (!product?.id) return;

    setCheckingStock(true);
    const { data } = await supabase
      .from('products')
      .select('stock_kg')
      .eq('id', product.id)
      .maybeSingle();

    if (data) {
      setCurrentStock(data.stock_kg);
    }
    setCheckingStock(false);
  }, [product?.id]);

  useEffect(() => {
    refreshStock();
    const interval = setInterval(refreshStock, 30000);
    return () => clearInterval(interval);
  }, [refreshStock]);

  if (!product) return null;

  const lineTotal = product.price_per_kg * item.quantity_kg;
  const isOverStock = item.quantity_kg > currentStock;
  const isOutOfStock = currentStock <= 0;

  const handleQuantityChange = async (newQuantity: number) => {
    await refreshStock();

    if (newQuantity > currentStock) {
      if (currentStock <= 0) {
        showToast(`${product.name} is now out of stock`, 'error');
      } else {
        showToast(`Only ${currentStock.toFixed(1)} kg of ${product.name} available`, 'error');
      }
      return;
    }

    setLoading(true);
    const { error } = await updateQuantity(item.id, newQuantity);
    if (error) {
      showToast('Failed to update quantity', 'error');
    }
    setLoading(false);
  };

  const handleRemove = async () => {
    setLoading(true);
    const { error } = await removeFromCart(item.id);
    if (error) {
      showToast('Failed to remove item', 'error');
    } else {
      showToast('Item removed from cart', 'success');
    }
    setLoading(false);
  };

  return (
    <View className={`bg-white rounded-2xl p-4 mb-3 border ${isOverStock || isOutOfStock ? 'border-red-300' : 'border-gray-100'} ${loading ? 'opacity-50' : ''}`}>
      <View className="flex-row">
        <View className="relative">
          <Image
            source={{ uri: product.image_url || 'https://images.pexels.com/photos/3296392/pexels-photo-3296392.jpeg?auto=compress&cs=tinysrgb&w=200' }}
            className="w-20 h-20 rounded-xl"
            resizeMode="cover"
          />
          {isOutOfStock && (
            <View className="absolute inset-0 bg-black/60 rounded-xl items-center justify-center">
              <Text className="text-white text-xs font-bold">Sold Out</Text>
            </View>
          )}
        </View>

        <View className="flex-1 ml-4">
          <Text className="text-gray-500 text-xs">
            {product.vendors?.name || 'Vendor'}
          </Text>
          <Text className="text-gray-800 font-semibold text-base" numberOfLines={1}>
            {product.name}
          </Text>
          <Text className="text-sky-600 font-medium mt-1">
            Rs.{product.price_per_kg.toFixed(0)}/kg
          </Text>
        </View>

        <View className="items-end">
          <Pressable
            onPress={handleRemove}
            disabled={loading}
            className="p-2 bg-red-50 rounded-lg"
          >
            <Trash2 size={18} color="#ef4444" />
          </Pressable>
        </View>
      </View>

      <View className="flex-row items-center mt-2 pt-2 border-t border-gray-100">
        <View className="flex-row items-center flex-1">
          {checkingStock ? (
            <ActivityIndicator size="small" color="#0ea5e9" />
          ) : (
            <>
              <View className={`w-2 h-2 rounded-full mr-2 ${isOutOfStock ? 'bg-red-500' : isOverStock ? 'bg-amber-500' : 'bg-green-500'}`} />
              <Text className={`text-xs ${isOutOfStock ? 'text-red-600' : isOverStock ? 'text-amber-600' : 'text-gray-500'}`}>
                {isOutOfStock
                  ? 'Out of stock'
                  : isOverStock
                    ? `Only ${currentStock.toFixed(1)} kg available`
                    : `${currentStock.toFixed(1)} kg in stock`
                }
              </Text>
            </>
          )}
          <Pressable onPress={refreshStock} className="ml-2 p-1" disabled={checkingStock}>
            <RefreshCw size={12} color={checkingStock ? '#9ca3af' : '#6b7280'} />
          </Pressable>
        </View>
      </View>

      {(isOverStock || isOutOfStock) && (
        <View className="mt-3 bg-red-50 rounded-xl p-3 flex-row items-center">
          <AlertTriangle size={16} color="#ef4444" />
          <Text className="text-red-700 text-sm ml-2 flex-1">
            {isOutOfStock
              ? 'This item is no longer available. Please remove it.'
              : `Stock reduced! Only ${currentStock.toFixed(1)} kg available.`
            }
          </Text>
        </View>
      )}

      <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-gray-100">
        {isOutOfStock ? (
          <Pressable
            onPress={handleRemove}
            className="bg-red-500 px-4 py-2 rounded-xl flex-row items-center"
            disabled={loading}
          >
            <Trash2 size={16} color="#fff" />
            <Text className="text-white font-semibold ml-2">Remove</Text>
          </Pressable>
        ) : (
          <QuantitySelector
            value={item.quantity_kg}
            onChange={handleQuantityChange}
            min={product.min_order_kg}
            max={currentStock}
            disabled={loading || isOutOfStock}
          />
        )}

        <View className="items-end">
          <Text className="text-gray-500 text-xs">Line Total</Text>
          <Text className={`font-bold text-lg ${isOverStock ? 'text-red-600' : 'text-gray-800'}`}>
            Rs.{lineTotal.toFixed(0)}
          </Text>
        </View>
      </View>
    </View>
  );
}
