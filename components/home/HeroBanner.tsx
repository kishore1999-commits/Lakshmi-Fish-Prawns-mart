import React from 'react';
import { View, Text, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Truck, Clock, Shield } from 'lucide-react-native';

export function HeroBanner() {
  return (
    <ImageBackground
      source={{ uri: 'https://images.pexels.com/photos/3296392/pexels-photo-3296392.jpeg?auto=compress&cs=tinysrgb&w=800' }}
      className="h-52 rounded-2xl overflow-hidden"
    >
      <LinearGradient
        colors={['rgba(3, 105, 161, 0.9)', 'rgba(7, 89, 133, 0.95)']}
        className="flex-1 p-5 justify-between"
      >
        <View>
          <Text className="text-white text-2xl font-bold">
            Fresh From The Sea
          </Text>
          <Text className="text-sky-100 mt-1">
            Premium seafood delivered to your doorstep
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
              <Truck size={16} color="#fff" />
            </View>
            <Text className="text-white text-xs ml-2">Next Day{'\n'}Delivery</Text>
          </View>

          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
              <Clock size={16} color="#fff" />
            </View>
            <Text className="text-white text-xs ml-2">Farm Fresh{'\n'}Daily</Text>
          </View>

          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
              <Shield size={16} color="#fff" />
            </View>
            <Text className="text-white text-xs ml-2">Quality{'\n'}Assured</Text>
          </View>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}
