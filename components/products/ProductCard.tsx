import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Star } from 'lucide-react-native';
import { Product } from '@/types/database';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();

  const isOutOfStock = product.stock_kg <= 0;

  return (
    <Pressable
      onPress={() => router.push(`/product/${product.id}`)}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4"
      style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
    >
      <View className="relative">
        <Image
          source={{ uri: product.image_url || 'https://images.pexels.com/photos/3296392/pexels-photo-3296392.jpeg?auto=compress&cs=tinysrgb&w=400' }}
          className="w-full h-40"
          resizeMode="cover"
        />
        {product.is_featured && (
          <View className="absolute top-2 left-2 bg-amber-400 px-2 py-1 rounded-lg">
            <Text className="text-xs font-bold text-amber-900">Featured</Text>
          </View>
        )}
        {isOutOfStock && (
          <View className="absolute inset-0 bg-black/50 items-center justify-center">
            <Text className="text-white font-bold text-lg">Out of Stock</Text>
          </View>
        )}
      </View>

      <View className="p-3">
        <Text className="text-gray-500 text-xs mb-1">
          {product.vendors?.name || 'Vendor'}
        </Text>
        <Text className="text-gray-800 font-semibold text-base" numberOfLines={1}>
          {product.name}
        </Text>

        <View className="flex-row items-center justify-between mt-2">
          <View>
            <Text className="text-sky-600 font-bold text-lg">
              Rs.{product.price_per_kg.toFixed(0)}/kg
            </Text>
            {!isOutOfStock && (
              <Text className="text-gray-400 text-xs">
                {product.stock_kg.toFixed(1)} kg available
              </Text>
            )}
          </View>

          {product.vendors?.rating && (
            <View className="flex-row items-center bg-green-50 px-2 py-1 rounded-lg">
              <Star size={12} color="#22c55e" fill="#22c55e" />
              <Text className="text-green-700 text-xs font-semibold ml-1">
                {product.vendors.rating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
