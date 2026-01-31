import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Filter } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Product, Category } from '@/types/database';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ProductCard } from '@/components/products/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchBar } from '@/components/home/SearchBar';

type SortOption = 'price_asc' | 'price_desc' | 'name';

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');

  const fetchData = async () => {
    if (!slug) return;

    try {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (categoryData) {
        setCategory(categoryData);

        const { data: productsData } = await supabase
          .from('products')
          .select('*, vendors(*)')
          .eq('category_id', categoryData.id)
          .eq('is_available', true);

        if (productsData) {
          setProducts(productsData as Product[]);
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [slug]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filteredProducts = products
    .filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.price_per_kg - b.price_per_kg;
        case 'price_desc':
          return b.price_per_kg - a.price_per_kg;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading products..." />;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center mb-3">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
          >
            <ArrowLeft size={20} color="#374151" />
          </Pressable>
          <View className="ml-4 flex-1">
            <Text className="text-xl font-bold text-gray-800">
              {category?.name || 'Category'}
            </Text>
            <Text className="text-gray-500 text-sm">
              {products.length} products
            </Text>
          </View>
        </View>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={`Search in ${category?.name || 'category'}...`}
        />
      </View>

      <View className="flex-row px-4 py-3 bg-white border-b border-gray-100">
        <Text className="text-gray-600 mr-2">Sort by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'name', label: 'Name' },
            { key: 'price_asc', label: 'Price: Low to High' },
            { key: 'price_desc', label: 'Price: High to Low' },
          ].map((option) => (
            <Pressable
              key={option.key}
              onPress={() => setSortBy(option.key as SortOption)}
              className={`px-3 py-1 rounded-full mr-2 ${
                sortBy === option.key ? 'bg-sky-600' : 'bg-gray-100'
              }`}
            >
              <Text
                className={`text-sm ${
                  sortBy === option.key ? 'text-white font-semibold' : 'text-gray-600'
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={<Filter size={40} color="#0ea5e9" />}
          title="No products found"
          message={
            searchQuery
              ? 'Try a different search term'
              : 'No products available in this category'
          }
        />
      ) : (
        <ScrollView
          className="flex-1 p-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View className="flex-row flex-wrap justify-between">
            {filteredProducts.map((product) => (
              <View key={product.id} className="w-[48%]">
                <ProductCard product={product} />
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
