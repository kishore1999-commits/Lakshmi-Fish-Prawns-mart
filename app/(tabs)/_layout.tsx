import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { Home, Grid3X3, ShoppingCart, User } from 'lucide-react-native';
import { useCart } from '@/contexts/CartContext';

function TabBarIcon({ icon: Icon, focused, color }: { icon: any; focused: boolean; color: string }) {
  return (
    <View className={`p-2 rounded-xl ${focused ? 'bg-sky-100' : ''}`}>
      <Icon size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
    </View>
  );
}

function CartTabIcon({ focused, color }: { focused: boolean; color: string }) {
  const { itemCount } = useCart();

  return (
    <View className="relative">
      <View className={`p-2 rounded-xl ${focused ? 'bg-sky-100' : ''}`}>
        <ShoppingCart size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
      </View>
      {itemCount > 0 && (
        <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-5 h-5 items-center justify-center px-1">
          <Text className="text-white text-xs font-bold">
            {itemCount > 9 ? '9+' : itemCount}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0ea5e9',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: '#f3f4f6',
          backgroundColor: '#ffffff',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon icon={Home} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon icon={Grid3X3} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ focused, color }) => (
            <CartTabIcon focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon icon={User} focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
