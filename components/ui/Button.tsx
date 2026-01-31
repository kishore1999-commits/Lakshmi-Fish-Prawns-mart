import React from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  className = '',
}: ButtonProps) {
  const baseStyles = 'flex-row items-center justify-center rounded-xl';

  const sizeStyles = {
    sm: 'px-4 py-2',
    md: 'px-6 py-3',
    lg: 'px-8 py-4',
  };

  const variantStyles = {
    primary: 'bg-sky-600',
    secondary: 'bg-gray-100',
    outline: 'bg-transparent border-2 border-sky-600',
    ghost: 'bg-transparent',
  };

  const textStyles = {
    primary: 'text-white',
    secondary: 'text-gray-800',
    outline: 'text-sky-600',
    ghost: 'text-sky-600',
  };

  const textSizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${isDisabled ? 'opacity-50' : ''} ${className}`}
      style={({ pressed }) => [{ opacity: pressed && !isDisabled ? 0.8 : 1 }]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#fff' : '#0ea5e9'}
        />
      ) : (
        <>
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={`font-semibold ${textStyles[variant]} ${textSizeStyles[size]}`}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}
