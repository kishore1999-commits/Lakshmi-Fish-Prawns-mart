import React from 'react';
import { View, Text } from 'react-native';
import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  message: string;
  actionTitle?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  message,
  actionTitle,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-8">
      <View className="w-20 h-20 rounded-full bg-sky-50 items-center justify-center mb-4">
        {icon}
      </View>
      <Text className="text-xl font-bold text-gray-800 text-center mb-2">
        {title}
      </Text>
      <Text className="text-gray-500 text-center mb-6">
        {message}
      </Text>
      {actionTitle && onAction && (
        <Button title={actionTitle} onPress={onAction} />
      )}
    </View>
  );
}
