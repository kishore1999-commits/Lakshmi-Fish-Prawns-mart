import React, { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { MapPin, Check, X, ChevronDown } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';

export function PinCodeChecker() {
  const { selectedPinCode, deliveryInfo, setPinCode, clearPinCode } = useApp();
  const { showToast } = useToast();
  const [isExpanded, setIsExpanded] = useState(!selectedPinCode);
  const [inputPinCode, setInputPinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheck = async () => {
    if (inputPinCode.length !== 6) {
      setError('Please enter a valid 6-digit pin code');
      return;
    }

    setLoading(true);
    setError('');

    const result = await setPinCode(inputPinCode);

    if (result.valid) {
      showToast(`Delivery available in ${result.info?.area_name}!`, 'success');
      setIsExpanded(false);
      setInputPinCode('');
    } else {
      setError('Sorry, we do not deliver to this area yet');
    }

    setLoading(false);
  };

  const handleClear = async () => {
    await clearPinCode();
    setIsExpanded(true);
  };

  if (selectedPinCode && deliveryInfo && !isExpanded) {
    return (
      <Pressable
        onPress={() => setIsExpanded(true)}
        className="bg-green-50 border border-green-200 rounded-2xl p-4 flex-row items-center"
      >
        <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center">
          <Check size={20} color="#22c55e" />
        </View>
        <View className="flex-1 ml-3">
          <Text className="text-green-800 font-semibold">
            Delivery Available
          </Text>
          <Text className="text-green-600 text-sm">
            {deliveryInfo.area_name}, {deliveryInfo.city} - {selectedPinCode}
          </Text>
        </View>
        <ChevronDown size={20} color="#22c55e" />
      </Pressable>
    );
  }

  return (
    <View className="bg-sky-50 border border-sky-200 rounded-2xl p-4">
      <View className="flex-row items-center mb-3">
        <MapPin size={20} color="#0ea5e9" />
        <Text className="text-sky-800 font-semibold ml-2">
          Check Delivery Availability
        </Text>
        {selectedPinCode && (
          <Pressable onPress={handleClear} className="ml-auto p-1">
            <X size={18} color="#6b7280" />
          </Pressable>
        )}
      </View>

      <View className="flex-row items-center">
        <TextInput
          placeholder="Enter PIN code"
          value={inputPinCode}
          onChangeText={(text) => {
            setInputPinCode(text.replace(/\D/g, '').slice(0, 6));
            setError('');
          }}
          keyboardType="number-pad"
          maxLength={6}
          className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-base mr-3"
          placeholderTextColor="#9ca3af"
        />
        <Button
          title="Check"
          onPress={handleCheck}
          loading={loading}
          disabled={inputPinCode.length !== 6}
          size="md"
        />
      </View>

      {error && (
        <Text className="text-red-500 text-sm mt-2">{error}</Text>
      )}
    </View>
  );
}
