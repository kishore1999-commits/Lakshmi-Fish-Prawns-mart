import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  ArrowLeft,
  MapPin,
  Tag,
  Wallet,
  CreditCard,
  Banknote,
  Truck,
  Check,
  AlertCircle,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useApp } from '@/contexts/AppContext';
import { DeliveryAddress } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';

type PaymentMethod = 'card' | 'upi' | 'cod';

export default function CheckoutScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const { items, subtotal, clearCart, refreshCart } = useCart();
  const { deliveryInfo, selectedPinCode, isOnline } = useApp();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<DeliveryAddress>({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    address_line1: '',
    address_line2: '',
    city: deliveryInfo?.city || '',
    state: '',
    pin_code: selectedPinCode || '',
  });
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponValid, setCouponValid] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [useWallet, setUseWallet] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [processingOrder, setProcessingOrder] = useState(false);

  const walletBalance = profile?.wallet_balance || 0;
  const deliveryCharge = deliveryInfo?.delivery_charge || 40;
  const walletUsed = useWallet ? Math.min(walletBalance, subtotal + deliveryCharge - couponDiscount) : 0;
  const total = Math.max(0, subtotal + deliveryCharge - couponDiscount - walletUsed);

  const expectedDelivery = new Date();
  expectedDelivery.setDate(expectedDelivery.getDate() + 1);

  useEffect(() => {
    if (!selectedPinCode || !user || items.length === 0) {
      router.replace('/(tabs)/cart');
    }
  }, [selectedPinCode, user, items.length]);

  const validateAddress = (): boolean => {
    if (!address.full_name.trim()) {
      showToast('Please enter your name', 'error');
      return false;
    }
    if (!address.phone.trim() || address.phone.length < 10) {
      showToast('Please enter a valid phone number', 'error');
      return false;
    }
    if (!address.address_line1.trim()) {
      showToast('Please enter your address', 'error');
      return false;
    }
    if (!address.city.trim()) {
      showToast('Please enter your city', 'error');
      return false;
    }
    if (!address.state.trim()) {
      showToast('Please enter your state', 'error');
      return false;
    }
    return true;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      showToast('Please enter a coupon code', 'error');
      return;
    }

    setApplyingCoupon(true);
    setCouponMessage('');

    try {
      const { data, error } = await supabase.rpc('validate_coupon', {
        p_code: couponCode.toUpperCase(),
        p_order_amount: subtotal,
      });

      if (error) throw error;

      const result = data?.[0];
      if (result?.valid) {
        setCouponDiscount(result.discount);
        setCouponMessage(result.message || 'Coupon applied!');
        setCouponValid(true);
        showToast('Coupon applied successfully!', 'success');
      } else {
        setCouponDiscount(0);
        setCouponMessage(result?.message || 'Invalid coupon');
        setCouponValid(false);
        showToast(result?.message || 'Invalid coupon', 'error');
      }
    } catch (error: any) {
      showToast('Failed to apply coupon', 'error');
      setCouponValid(false);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const verifyStockAndCreateOrder = async (): Promise<{ success: boolean; orderId?: string; message?: string }> => {
    await refreshCart();

    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('stock_kg, name')
        .eq('id', item.product_id)
        .maybeSingle();

      if (!product) {
        return { success: false, message: `Product ${item.products?.name} is no longer available` };
      }

      if (product.stock_kg < item.quantity_kg) {
        return {
          success: false,
          message: `Sorry, ${product.name} now has only ${product.stock_kg.toFixed(1)} kg left`,
        };
      }
    }

    for (const item of items) {
      const { data: result } = await supabase.rpc('deduct_stock', {
        p_product_id: item.product_id,
        p_quantity: item.quantity_kg,
      });

      if (!result?.[0]?.success) {
        return {
          success: false,
          message: `Sorry, ${result?.[0]?.product_name} now has only ${result?.[0]?.available_stock?.toFixed(1)} kg left`,
        };
      }
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user!.id,
        status: 'pending',
        subtotal,
        delivery_charge: deliveryCharge,
        coupon_code: couponValid ? couponCode.toUpperCase() : null,
        coupon_discount: couponDiscount,
        wallet_used: walletUsed,
        total,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'cod' ? 'pending' : 'pending',
        delivery_address: address,
        expected_delivery: expectedDelivery.toISOString().split('T')[0],
      })
      .select()
      .single();

    if (orderError || !order) {
      return { success: false, message: 'Failed to create order' };
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.products?.name || 'Product',
      vendor_name: item.products?.vendors?.name || 'Vendor',
      image_url: item.products?.image_url,
      quantity_kg: item.quantity_kg,
      price_per_kg: item.products?.price_per_kg || 0,
      total: (item.products?.price_per_kg || 0) * item.quantity_kg,
    }));

    await supabase.from('order_items').insert(orderItems);

    if (walletUsed > 0) {
      await supabase.rpc('deduct_wallet', {
        p_user_id: user!.id,
        p_amount: walletUsed,
      });
    }

    if (couponValid) {
      await supabase.rpc('increment_coupon_usage', { p_code: couponCode.toUpperCase() });
    }

    if (!profile?.first_order_completed) {
      await supabase.rpc('process_referral_reward', { p_user_id: user!.id });
    }

    return { success: true, orderId: order.id };
  };

  const handlePlaceOrder = async () => {
    if (!isOnline) {
      showToast('You are offline. Please check your connection.', 'error');
      return;
    }

    if (!validateAddress()) return;

    setProcessingOrder(true);

    try {
      const result = await verifyStockAndCreateOrder();

      if (!result.success) {
        showToast(result.message || 'Failed to place order', 'error');
        setProcessingOrder(false);
        return;
      }

      if ((paymentMethod === 'card' || paymentMethod === 'upi') && total > 0) {
        showToast('Order placed! Complete payment to confirm.', 'info');
      } else {
        await supabase
          .from('orders')
          .update({ status: 'confirmed', payment_status: 'pending' })
          .eq('id', result.orderId);
      }

      await clearCart();
      await refreshProfile();

      showToast('Order placed successfully!', 'success');
      router.replace(`/order/${result.orderId}`);
    } catch (error: any) {
      showToast(error.message || 'Failed to place order', 'error');
    } finally {
      setProcessingOrder(false);
    }
  };

  if (items.length === 0) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
        >
          <ArrowLeft size={20} color="#374151" />
        </Pressable>
        <Text className="text-xl font-bold text-gray-800 ml-4">Checkout</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          <View className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex-row items-center mb-4">
            <Truck size={20} color="#0ea5e9" />
            <View className="ml-3">
              <Text className="text-sky-800 font-semibold">Next Day Delivery</Text>
              <Text className="text-sky-600 text-sm">
                Expected: {expectedDelivery.toLocaleDateString('en-IN', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>

          <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
            <View className="flex-row items-center mb-4">
              <MapPin size={20} color="#0ea5e9" />
              <Text className="text-lg font-semibold text-gray-800 ml-2">
                Delivery Address
              </Text>
            </View>

            <Input
              label="Full Name"
              value={address.full_name}
              onChangeText={(text) => setAddress({ ...address, full_name: text })}
              placeholder="Enter your name"
              className="mb-3"
            />

            <Input
              label="Phone Number"
              value={address.phone}
              onChangeText={(text) => setAddress({ ...address, phone: text.replace(/\D/g, '').slice(0, 10) })}
              placeholder="Enter 10-digit number"
              keyboardType="phone-pad"
              className="mb-3"
            />

            <Input
              label="Address Line 1"
              value={address.address_line1}
              onChangeText={(text) => setAddress({ ...address, address_line1: text })}
              placeholder="House/Flat No., Building, Street"
              className="mb-3"
            />

            <Input
              label="Address Line 2 (Optional)"
              value={address.address_line2}
              onChangeText={(text) => setAddress({ ...address, address_line2: text })}
              placeholder="Landmark, Area"
              className="mb-3"
            />

            <View className="flex-row mb-3">
              <View className="flex-1 mr-2">
                <Input
                  label="City"
                  value={address.city}
                  onChangeText={(text) => setAddress({ ...address, city: text })}
                  placeholder="City"
                />
              </View>
              <View className="flex-1 ml-2">
                <Input
                  label="State"
                  value={address.state}
                  onChangeText={(text) => setAddress({ ...address, state: text })}
                  placeholder="State"
                />
              </View>
            </View>

            <Input
              label="PIN Code"
              value={address.pin_code}
              editable={false}
              className="bg-gray-100"
            />
          </View>

          <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
            <View className="flex-row items-center mb-4">
              <Tag size={20} color="#0ea5e9" />
              <Text className="text-lg font-semibold text-gray-800 ml-2">
                Apply Coupon
              </Text>
            </View>

            <View className="flex-row">
              <TextInput
                value={couponCode}
                onChangeText={(text) => {
                  setCouponCode(text.toUpperCase());
                  setCouponValid(false);
                  setCouponDiscount(0);
                  setCouponMessage('');
                }}
                placeholder="Enter coupon code"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 mr-2"
                autoCapitalize="characters"
              />
              <Button
                title="Apply"
                onPress={handleApplyCoupon}
                loading={applyingCoupon}
                disabled={!couponCode.trim() || couponValid}
                variant={couponValid ? 'secondary' : 'primary'}
              />
            </View>

            {couponMessage && (
              <View className={`flex-row items-center mt-2 ${couponValid ? 'text-green-600' : 'text-red-600'}`}>
                {couponValid ? (
                  <Check size={16} color="#22c55e" />
                ) : (
                  <AlertCircle size={16} color="#ef4444" />
                )}
                <Text className={`ml-1 ${couponValid ? 'text-green-600' : 'text-red-600'}`}>
                  {couponMessage}
                </Text>
              </View>
            )}
          </View>

          {walletBalance > 0 && (
            <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
              <Pressable
                onPress={() => setUseWallet(!useWallet)}
                className="flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <Wallet size={20} color="#0ea5e9" />
                  <View className="ml-3">
                    <Text className="text-gray-800 font-semibold">Use Wallet Balance</Text>
                    <Text className="text-gray-500 text-sm">
                      Available: Rs.{walletBalance.toFixed(0)}
                    </Text>
                  </View>
                </View>
                <View className={`w-6 h-6 rounded-md border-2 items-center justify-center ${useWallet ? 'bg-sky-600 border-sky-600' : 'border-gray-300'}`}>
                  {useWallet && <Check size={16} color="#fff" />}
                </View>
              </Pressable>
            </View>
          )}

          <View className="bg-slate-700 rounded-2xl px-4 py-3 flex-row items-center justify-between mb-4">
            <View className="flex-row items-center flex-1">
              <Text className="text-white font-semibold">MY CART</Text>
              <Text className="text-gray-300 ml-2 text-sm">
                {items.length} Item{items.length !== 1 ? 's' : ''} • Total Amount Rs.{(subtotal + deliveryCharge - couponDiscount).toFixed(0)}
              </Text>
            </View>
            <Pressable onPress={() => router.replace('/(tabs)/cart')}>
              <Text className="text-orange-500 text-sm font-semibold ml-2">›</Text>
            </Pressable>
          </View>

          <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-semibold text-gray-800">MAKE PAYMENT WITH</Text>
              <Text className="text-orange-500 font-semibold text-sm">Other?</Text>
            </View>

            <Pressable
              onPress={() => setPaymentMethod('card')}
              className="flex-row items-center p-4 mb-3"
            >
              <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                paymentMethod === 'card' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
              }`}>
                {paymentMethod === 'card' && <View className="w-2 h-2 bg-white rounded-full" />}
              </View>
              <CreditCard size={20} color="#374151" className="mx-3" />
              <Text className="text-gray-800 font-semibold">Credit / Debit card</Text>
            </Pressable>

            <Pressable
              onPress={() => setPaymentMethod('upi')}
              className="flex-row items-center p-4 mb-3"
            >
              <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                paymentMethod === 'upi' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
              }`}>
                {paymentMethod === 'upi' && <View className="w-2 h-2 bg-white rounded-full" />}
              </View>
              <Wallet size={20} color="#374151" className="mx-3" />
              <Text className="text-gray-800 font-semibold">UPI Payment</Text>
            </Pressable>

            <Pressable
              onPress={() => setPaymentMethod('cod')}
              className="flex-row items-center p-4"
            >
              <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                paymentMethod === 'cod' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
              }`}>
                {paymentMethod === 'cod' && <View className="w-2 h-2 bg-white rounded-full" />}
              </View>
              <Banknote size={20} color="#374151" className="mx-3" />
              <Text className="text-gray-800 font-semibold">Cash on Delivery</Text>
            </Pressable>
          </View>

          <View className="bg-white rounded-2xl p-4 mb-6 border border-gray-100">
            <Text className="text-lg font-semibold text-gray-800 mb-4">
              Order Summary
            </Text>

            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Subtotal ({items.length} items)</Text>
              <Text className="text-gray-800">Rs.{subtotal.toFixed(0)}</Text>
            </View>

            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Delivery Charge</Text>
              <Text className="text-gray-800">Rs.{deliveryCharge.toFixed(0)}</Text>
            </View>

            {couponDiscount > 0 && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-green-600">Coupon Discount</Text>
                <Text className="text-green-600">-Rs.{couponDiscount.toFixed(0)}</Text>
              </View>
            )}

            {walletUsed > 0 && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-green-600">Wallet Used</Text>
                <Text className="text-green-600">-Rs.{walletUsed.toFixed(0)}</Text>
              </View>
            )}

            <View className="border-t border-gray-100 pt-3 mt-2">
              <View className="flex-row justify-between">
                <Text className="text-lg font-bold text-gray-800">Total</Text>
                <Text className="text-lg font-bold text-sky-600">Rs.{total.toFixed(0)}</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View className="p-4 bg-white border-t border-gray-100">
          <Button
            title={`Place Order${total > 0 ? ` - Rs.${total.toFixed(0)}` : ''}`}
            onPress={handlePlaceOrder}
            loading={processingOrder}
            size="lg"
            className="w-full"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
