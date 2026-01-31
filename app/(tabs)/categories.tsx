import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Category } from '@/types/database';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function CategoriesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  const fetchCategories = async () => {
    try {
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('display_order');

      if (categoriesData) {
        setCategories(categoriesData);

        const counts: Record<string, number> = {};
        for (const cat of categoriesData) {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', cat.id)
            .eq('is_available', true);
          counts[cat.id] = count || 0;
        }
        setProductCounts(counts);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategories();
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading categories..." />;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="px-4 py-4 bg-white border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-800">Categories</Text>
        <Text className="text-gray-500 mt-1">Browse our fresh selection</Text>
      </View>

      <ScrollView
        className="flex-1 p-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {categories.map((category) => (
          <Pressable
            key={category.id}
            onPress={() => router.push(`/category/${category.slug}`)}
            className="bg-white rounded-2xl mb-4 overflow-hidden shadow-sm border border-gray-100"
            style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
          >
            <Image
              source={{ uri: category.image_url || 'https://images.pexels.com/photos/3296392/pexels-photo-3296392.jpeg?auto=compress&cs=tinysrgb&w=600' }}
              className="w-full h-36"
              resizeMode="cover"
            />
            <View className="p-4 flex-row items-center justify-between">
              <View>
                <Text className="text-lg font-bold text-gray-800">
                  {category.name}
                </Text>
                <Text className="text-gray-500 text-sm">
                  {productCounts[category.id] || 0} products
                </Text>
              </View>
              <View className="w-10 h-10 rounded-full bg-sky-100 items-center justify-center">
                <ChevronRight size={20} color="#0ea5e9" />
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
