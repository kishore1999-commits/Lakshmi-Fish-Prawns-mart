import React from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Search, X } from 'lucide-react-native';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search for seafood...',
}: SearchBarProps) {
  return (
    <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
      <Search size={20} color="#9ca3af" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        className="flex-1 ml-3 text-gray-800 text-base"
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText('')} className="p-1">
          <X size={18} color="#6b7280" />
        </Pressable>
      )}
    </View>
  );
}
