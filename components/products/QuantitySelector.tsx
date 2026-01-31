import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

export function QuantitySelector({
  value,
  onChange,
  min = 0.5,
  max = 100,
  step = 0.5,
  disabled = false,
}: QuantitySelectorProps) {
  const handleDecrease = () => {
    if (disabled) return;
    const newValue = Math.max(min, value - step);
    onChange(parseFloat(newValue.toFixed(1)));
  };

  const handleIncrease = () => {
    if (disabled) return;
    const newValue = Math.min(max, value + step);
    onChange(parseFloat(newValue.toFixed(1)));
  };

  const canDecrease = !disabled && value > min;
  const canIncrease = !disabled && value < max;
  const atMaxStock = value >= max && max < 100;

  return (
    <View className={`flex-row items-center bg-gray-100 rounded-xl ${disabled ? 'opacity-50' : ''}`}>
      <Pressable
        onPress={handleDecrease}
        disabled={!canDecrease}
        className={`w-10 h-10 items-center justify-center rounded-l-xl ${canDecrease ? 'bg-sky-600' : 'bg-gray-300'}`}
      >
        <Minus size={18} color="#fff" />
      </Pressable>

      <View className="px-4 py-2 min-w-16 items-center">
        <Text className="text-gray-800 font-bold text-base">
          {value.toFixed(1)}
        </Text>
        <Text className="text-gray-500 text-xs">kg</Text>
      </View>

      <Pressable
        onPress={handleIncrease}
        disabled={!canIncrease}
        className={`w-10 h-10 items-center justify-center rounded-r-xl ${canIncrease ? 'bg-sky-600' : atMaxStock ? 'bg-amber-400' : 'bg-gray-300'}`}
      >
        <Plus size={18} color="#fff" />
      </Pressable>
    </View>
  );
}
