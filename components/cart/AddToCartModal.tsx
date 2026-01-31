import React from 'react';
import { View, Text, Modal, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ShoppingCart, ArrowRight, ChevronLeft, Check } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';

interface AddToCartModalProps {
  visible: boolean;
  onClose: () => void;
  productName: string;
  productImage?: string;
  quantity: number;
  total: number;
}

export function AddToCartModal({
  visible,
  onClose,
  productName,
  productImage,
  quantity,
  total,
}: AddToCartModalProps) {
  const router = useRouter();

  const handleViewCart = () => {
    onClose();
    router.push('/(tabs)/cart');
  };

  const handleContinueShopping = () => {
    onClose();
    router.back();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/50 justify-end"
        onPress={onClose}
      >
        <Pressable
          className="bg-white rounded-t-3xl"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="items-center pt-6 pb-2">
            <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-4">
              <Check size={32} color="#22c55e" />
            </View>
            <Text className="text-xl font-bold text-gray-800 text-center">
              Added to Cart!
            </Text>
          </View>

          <View className="flex-row items-center p-4 mx-4 bg-gray-50 rounded-xl mb-4">
            {productImage && (
              <Image
                source={{ uri: productImage }}
                className="w-16 h-16 rounded-xl"
                resizeMode="cover"
              />
            )}
            <View className="flex-1 ml-3">
              <Text className="text-gray-800 font-semibold" numberOfLines={2}>
                {productName}
              </Text>
              <Text className="text-gray-500 text-sm mt-1">
                {quantity.toFixed(1)} kg
              </Text>
            </View>
            <Text className="text-sky-600 font-bold text-lg">
              Rs.{total.toFixed(0)}
            </Text>
          </View>

          <View className="px-4 pb-8">
            <Button
              title="View Cart"
              onPress={handleViewCart}
              icon={<ShoppingCart size={20} color="#fff" />}
              size="lg"
              className="mb-3"
            />
            <Button
              title="Continue Shopping"
              onPress={handleContinueShopping}
              variant="outline"
              icon={<ChevronLeft size={20} color="#0ea5e9" />}
              size="lg"
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
