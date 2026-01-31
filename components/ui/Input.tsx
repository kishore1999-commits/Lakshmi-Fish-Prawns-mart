import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({
  label,
  error,
  icon,
  className = '',
  ...props
}: InputProps) {
  return (
    <View className={className}>
      {label && (
        <Text className="text-gray-700 font-medium mb-2">{label}</Text>
      )}
      <View className={`flex-row items-center bg-gray-50 border rounded-xl px-4 ${error ? 'border-red-400' : 'border-gray-200'}`}>
        {icon && <View className="mr-3">{icon}</View>}
        <TextInput
          className="flex-1 py-3 text-gray-800 text-base"
          placeholderTextColor="#9ca3af"
          {...props}
        />
      </View>
      {error && (
        <Text className="text-red-500 text-sm mt-1">{error}</Text>
      )}
    </View>
  );
}
