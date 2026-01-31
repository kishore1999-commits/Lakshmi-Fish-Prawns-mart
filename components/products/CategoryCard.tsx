import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Category } from '@/types/database';

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/category/${category.slug}`)}
      className="mr-4 items-center"
      style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
    >
      <View className="w-20 h-20 rounded-2xl overflow-hidden bg-sky-50 border-2 border-sky-100">
        <Image
          source={{ uri: category.image_url || 'https://images.pexels.com/photos/3296392/pexels-photo-3296392.jpeg?auto=compress&cs=tinysrgb&w=200' }}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>
      <Text className="mt-2 text-gray-700 font-medium text-sm">
        {category.name}
      </Text>
    </Pressable>
  );
}
