import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Share, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import {
  User,
  Wallet,
  Gift,
  Package,
  LogOut,
  ChevronRight,
  Copy,
  Share2,
  Users,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { Order } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import * as Clipboard from 'expo-clipboard';

export default function AccountScreen() {
  const router = useRouter();
  const { user, profile, signOut, refreshProfile, loading: authLoading } = useAuth();
  const { setShowAuthModal, setAuthModalMessage } = useApp();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!user) return;

    setLoadingOrders(true);
    try {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) setOrders(data);
    } finally {
      setLoadingOrders(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchOrders();
      refreshProfile();
    }
  }, [user, fetchOrders, refreshProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    refreshProfile();
    fetchOrders();
  };

  const handleCopyReferral = async () => {
    if (profile?.referral_code) {
      await Clipboard.setStringAsync(profile.referral_code);
      showToast('Referral code copied!', 'success');
    }
  };

  const handleShareReferral = async () => {
    if (!profile?.referral_code) return;

    const message = `Join FreshSea Market using my referral code ${profile.referral_code} and get Rs.100 in your wallet on your first order! Download now.`;

    try {
      if (Platform.OS === 'web') {
        await navigator.share({ text: message });
      } else {
        await Share.share({ message });
      }
    } catch (error) {
      handleCopyReferral();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    showToast('Signed out successfully', 'success');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'shipped':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-amber-100 text-amber-700';
    }
  };

  if (authLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <View className="px-4 py-4 bg-white border-b border-gray-100">
          <Text className="text-2xl font-bold text-gray-800">Account</Text>
        </View>
        <EmptyState
          icon={<User size={40} color="#0ea5e9" />}
          title="Welcome to FreshSea"
          message="Sign in to track orders, earn rewards, and more"
          actionTitle="Sign In"
          onAction={() => {
            setAuthModalMessage('');
            setShowAuthModal(true);
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="bg-sky-600 px-4 py-6">
          <View className="flex-row items-center">
            <View className="w-16 h-16 rounded-full bg-white items-center justify-center">
              <User size={32} color="#0ea5e9" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-white text-xl font-bold">
                {profile?.full_name || 'User'}
              </Text>
              <Text className="text-sky-100">{user.email}</Text>
            </View>
          </View>
        </View>

        <View className="flex-row p-4 -mt-4">
          <View className="flex-1 bg-white rounded-2xl p-4 mr-2 shadow-sm border border-gray-100">
            <View className="flex-row items-center mb-2">
              <Wallet size={20} color="#0ea5e9" />
              <Text className="text-gray-600 ml-2">Wallet</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-800">
              Rs.{(profile?.wallet_balance || 0).toFixed(0)}
            </Text>
          </View>

          <View className="flex-1 bg-white rounded-2xl p-4 ml-2 shadow-sm border border-gray-100">
            <View className="flex-row items-center mb-2">
              <Users size={20} color="#0ea5e9" />
              <Text className="text-gray-600 ml-2">Referrals</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-800">
              {profile?.referral_count || 0}
            </Text>
          </View>
        </View>

        <View className="mx-4 mb-4 bg-gradient-to-r from-sky-50 to-sky-100 rounded-2xl p-4 border border-sky-200">
          <View className="flex-row items-center mb-3">
            <Gift size={20} color="#0ea5e9" />
            <Text className="text-sky-800 font-semibold ml-2">
              Refer & Earn Rs.100
            </Text>
          </View>
          <Text className="text-sky-600 text-sm mb-3">
            Share your code and both you and your friend get Rs.100 on their first order!
          </Text>

          <View className="bg-white rounded-xl p-3 flex-row items-center justify-between">
            <Text className="text-gray-800 font-mono font-bold text-lg">
              {profile?.referral_code || 'Loading...'}
            </Text>
            <View className="flex-row">
              <Pressable
                onPress={handleCopyReferral}
                className="w-10 h-10 rounded-lg bg-gray-100 items-center justify-center mr-2"
              >
                <Copy size={18} color="#0ea5e9" />
              </Pressable>
              <Pressable
                onPress={handleShareReferral}
                className="w-10 h-10 rounded-lg bg-sky-600 items-center justify-center"
              >
                <Share2 size={18} color="#fff" />
              </Pressable>
            </View>
          </View>
        </View>

        <View className="mx-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-800">Recent Orders</Text>
            {orders.length > 0 && (
              <Pressable>
                <Text className="text-sky-600 font-medium">View All</Text>
              </Pressable>
            )}
          </View>

          {loadingOrders ? (
            <LoadingSpinner />
          ) : orders.length === 0 ? (
            <View className="bg-white rounded-2xl p-6 items-center border border-gray-100">
              <Package size={40} color="#d1d5db" />
              <Text className="text-gray-500 mt-2">No orders yet</Text>
            </View>
          ) : (
            orders.map((order) => (
              <Pressable
                key={order.id}
                onPress={() => router.push(`/order/${order.id}`)}
                className="bg-white rounded-2xl p-4 mb-3 border border-gray-100"
                style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="font-semibold text-gray-800">
                    {order.order_number}
                  </Text>
                  <View className={`px-2 py-1 rounded-lg ${getStatusColor(order.status)}`}>
                    <Text className="text-xs font-medium capitalize">
                      {order.status}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-500 text-sm">
                    {new Date(order.created_at).toLocaleDateString()}
                  </Text>
                  <Text className="font-bold text-gray-800">
                    Rs.{order.total.toFixed(0)}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </View>

        <View className="mx-4 mb-8">
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="outline"
            icon={<LogOut size={20} color="#0ea5e9" />}
            className="w-full"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
