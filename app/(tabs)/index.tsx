import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Product, Category } from '@/types/database';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { HeroBanner } from '@/components/home/HeroBanner';
import { PinCodeChecker } from '@/components/home/PinCodeChecker';
import { SearchBar } from '@/components/home/SearchBar';
import { CategoryCard } from '@/components/products/CategoryCard';
import { ProductCard } from '@/components/products/ProductCard';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [categoriesRes, productsRes] = await Promise.all([
        supabase
          .from('categories')
          .select('*')
          .order('display_order'),
        supabase
          .from('products')
          .select('*, vendors(*)')
          .eq('is_featured', true)
          .eq('is_available', true)
          .limit(6),
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (productsRes.data) setFeaturedProducts(productsRes.data as Product[]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const searchProducts = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data } = await supabase
        .from('products')
        .select('*, vendors(*)')
        .eq('is_available', true)
        .ilike('name', `%${query}%`)
        .limit(10);

      setSearchResults((data as Product[]) || []);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading fresh catches..." />;
  }

  const showSearchResults = searchQuery.length >= 2;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="px-4 pt-2 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-2xl font-bold text-gray-800">FreshSea</Text>
              <Text className="text-gray-500">Market</Text>
            </View>
            <View className="w-12 h-12 rounded-full bg-sky-100 items-center justify-center">
              <Text className="text-2xl">🐟</Text>
            </View>
          </View>

          <PinCodeChecker />
        </View>

        <View className="px-4 mb-4">
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search fish, prawns, crabs..."
          />
        </View>

        {showSearchResults ? (
          <View className="px-4 pb-6">
            {searching ? (
              <LoadingSpinner message="Searching..." />
            ) : searchResults.length > 0 ? (
              <>
                <Text className="text-lg font-bold text-gray-800 mb-4">
                  Search Results ({searchResults.length})
                </Text>
                {searchResults.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </>
            ) : (
              <View className="items-center py-8">
                <Text className="text-gray-500">No products found</Text>
              </View>
            )}
          </View>
        ) : (
          <>
            <View className="px-4 mb-6">
              <HeroBanner />
            </View>

            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-800 px-4 mb-3">
                Shop by Category
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="pl-4"
              >
                {categories.map((category) => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </ScrollView>
            </View>

            <View className="px-4 pb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold text-gray-800">
                  Featured Products
                </Text>
              </View>
              <View className="flex-row flex-wrap justify-between">
                {featuredProducts.map((product) => (
                  <View key={product.id} className="w-[48%]">
                    <ProductCard product={product} />
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
