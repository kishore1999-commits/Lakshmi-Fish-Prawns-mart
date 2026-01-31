import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Truck,
  Package,
  MapPin,
  Phone,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Order, OrderItem, DeliveryAddress } from '@/types/database';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: Package },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'processing', label: 'Processing', icon: Clock },
  { key: 'shipped', label: 'Out for Delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    if (!id) return;

    try {
      const [orderRes, itemsRes] = await Promise.all([
        supabase.from('orders').select('*').eq('id', id).maybeSingle(),
        supabase.from('order_items').select('*').eq('order_id', id),
      ]);

      if (orderRes.data) setOrder(orderRes.data);
      if (itemsRes.data) setItems(itemsRes.data);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIndex = () => {
    if (!order) return 0;
    if (order.status === 'cancelled') return -1;
    return statusSteps.findIndex((s) => s.key === order.status);
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading order..." />;
  }

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Order not found</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="ghost" className="mt-4" />
        </View>
      </SafeAreaView>
    );
  }

  const address = order.delivery_address as DeliveryAddress;
  const statusIndex = getStatusIndex();

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
        >
          <ArrowLeft size={20} color="#374151" />
        </Pressable>
        <View className="ml-4">
          <Text className="text-lg font-bold text-gray-800">Order Details</Text>
          <Text className="text-gray-500 text-sm">{order.order_number}</Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {order.status === 'cancelled' ? (
          <View className="m-4 bg-red-50 border border-red-200 rounded-2xl p-4">
            <Text className="text-red-700 font-semibold text-center">
              This order has been cancelled
            </Text>
          </View>
        ) : (
          <View className="bg-white m-4 rounded-2xl p-4 border border-gray-100">
            <Text className="text-lg font-semibold text-gray-800 mb-4">
              Order Status
            </Text>

            {statusSteps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index <= statusIndex;
              const isCurrent = index === statusIndex;

              return (
                <View key={step.key} className="flex-row items-start mb-4 last:mb-0">
                  <View className="items-center mr-4">
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    >
                      <Icon size={20} color={isCompleted ? '#fff' : '#9ca3af'} />
                    </View>
                    {index < statusSteps.length - 1 && (
                      <View
                        className={`w-0.5 h-8 mt-2 ${
                          index < statusIndex ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </View>
                  <View className="flex-1 pt-2">
                    <Text
                      className={`font-semibold ${
                        isCompleted ? 'text-green-700' : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </Text>
                    {isCurrent && (
                      <Text className="text-gray-500 text-sm mt-1">
                        {order.status === 'pending' && 'Waiting for confirmation'}
                        {order.status === 'confirmed' && 'Your order has been confirmed'}
                        {order.status === 'processing' && 'Preparing your order'}
                        {order.status === 'shipped' && 'On the way to you'}
                        {order.status === 'delivered' && 'Order delivered successfully'}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View className="bg-white mx-4 mb-4 rounded-2xl p-4 border border-gray-100">
          <View className="flex-row items-center mb-4">
            <Truck size={20} color="#0ea5e9" />
            <Text className="text-lg font-semibold text-gray-800 ml-2">
              Delivery Details
            </Text>
          </View>

          <View className="bg-sky-50 rounded-xl p-3 mb-4">
            <Text className="text-sky-800 font-medium">
              Expected Delivery: {new Date(order.expected_delivery).toLocaleDateString('en-IN', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>

          <View className="flex-row items-start mb-2">
            <MapPin size={18} color="#6b7280" />
            <View className="ml-2 flex-1">
              <Text className="text-gray-800 font-medium">{address.full_name}</Text>
              <Text className="text-gray-600 text-sm">
                {address.address_line1}
                {address.address_line2 ? `, ${address.address_line2}` : ''}
              </Text>
              <Text className="text-gray-600 text-sm">
                {address.city}, {address.state} - {address.pin_code}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <Phone size={18} color="#6b7280" />
            <Text className="text-gray-600 ml-2">{address.phone}</Text>
          </View>
        </View>

        <View className="bg-white mx-4 mb-4 rounded-2xl p-4 border border-gray-100">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Order Items ({items.length})
          </Text>

          {items.map((item) => (
            <View
              key={item.id}
              className="flex-row items-center py-3 border-b border-gray-100 last:border-b-0"
            >
              <Image
                source={{ uri: item.image_url || 'https://images.pexels.com/photos/3296392/pexels-photo-3296392.jpeg?auto=compress&cs=tinysrgb&w=200' }}
                className="w-16 h-16 rounded-xl"
                resizeMode="cover"
              />
              <View className="flex-1 ml-3">
                <Text className="text-gray-800 font-medium">{item.product_name}</Text>
                <Text className="text-gray-500 text-sm">{item.vendor_name}</Text>
                <Text className="text-gray-500 text-sm">
                  {item.quantity_kg} kg x Rs.{item.price_per_kg}
                </Text>
              </View>
              <Text className="text-gray-800 font-semibold">
                Rs.{item.total.toFixed(0)}
              </Text>
            </View>
          ))}
        </View>

        <View className="bg-white mx-4 mb-6 rounded-2xl p-4 border border-gray-100">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Payment Summary
          </Text>

          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Subtotal</Text>
            <Text className="text-gray-800">Rs.{order.subtotal.toFixed(0)}</Text>
          </View>

          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Delivery Charge</Text>
            <Text className="text-gray-800">Rs.{order.delivery_charge.toFixed(0)}</Text>
          </View>

          {order.coupon_discount > 0 && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-green-600">Coupon ({order.coupon_code})</Text>
              <Text className="text-green-600">-Rs.{order.coupon_discount.toFixed(0)}</Text>
            </View>
          )}

          {order.wallet_used > 0 && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-green-600">Wallet Used</Text>
              <Text className="text-green-600">-Rs.{order.wallet_used.toFixed(0)}</Text>
            </View>
          )}

          <View className="border-t border-gray-100 pt-3 mt-2">
            <View className="flex-row justify-between">
              <Text className="text-lg font-bold text-gray-800">Total</Text>
              <Text className="text-lg font-bold text-sky-600">Rs.{order.total.toFixed(0)}</Text>
            </View>
            <View className="flex-row justify-between mt-1">
              <Text className="text-gray-500 text-sm">Payment Method</Text>
              <Text className="text-gray-600 text-sm capitalize">{order.payment_method}</Text>
            </View>
          </View>
        </View>

        <View className="px-4 pb-6">
          <Button
            title="Continue Shopping"
            onPress={() => router.replace('/(tabs)/')}
            variant="outline"
            className="w-full"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
