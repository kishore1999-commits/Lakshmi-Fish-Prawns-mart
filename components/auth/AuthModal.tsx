import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { X, Mail, Lock, User, Tag } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

type AuthMode = 'login' | 'signup';

export function AuthModal() {
  const { showAuthModal, setShowAuthModal, authModalMessage } = useApp();
  const { signIn, signUp } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setReferralCode('');
    setErrors({});
  };

  const handleClose = () => {
    setShowAuthModal(false);
    resetForm();
    setMode('login');
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (mode === 'signup' && !fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) throw error;
        showToast('Welcome back!', 'success');
      } else {
        const { error } = await signUp(email, password, fullName, referralCode || undefined);
        if (error) throw error;
        showToast('Account created successfully!', 'success');
      }
      handleClose();
    } catch (error: any) {
      showToast(error.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setErrors({});
  };

  return (
    <Modal
      visible={showAuthModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-white"
      >
        <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
          <Text className="text-xl font-bold text-gray-800">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </Text>
          <Pressable onPress={handleClose} className="p-2">
            <X size={24} color="#374151" />
          </Pressable>
        </View>

        <ScrollView className="flex-1 p-6">
          {authModalMessage && (
            <View className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-6">
              <Text className="text-sky-700 text-center">{authModalMessage}</Text>
            </View>
          )}

          <View className="items-center mb-8">
            <View className="w-20 h-20 rounded-full bg-sky-100 items-center justify-center mb-4">
              <Text className="text-4xl">🐟</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-800">FreshSea Market</Text>
            <Text className="text-gray-500 mt-1">Fresh seafood delivered daily</Text>
          </View>

          {mode === 'signup' && (
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={setFullName}
              error={errors.fullName}
              icon={<User size={20} color="#9ca3af" />}
              autoCapitalize="words"
              className="mb-4"
            />
          )}

          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            icon={<Mail size={20} color="#9ca3af" />}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            className="mb-4"
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            icon={<Lock size={20} color="#9ca3af" />}
            secureTextEntry
            className="mb-4"
          />

          {mode === 'signup' && (
            <Input
              label="Referral Code (Optional)"
              placeholder="Enter referral code"
              value={referralCode}
              onChangeText={(text) => setReferralCode(text.toUpperCase())}
              icon={<Tag size={20} color="#9ca3af" />}
              autoCapitalize="characters"
              maxLength={8}
              className="mb-6"
            />
          )}

          <Button
            title={mode === 'login' ? 'Sign In' : 'Create Account'}
            onPress={handleSubmit}
            loading={loading}
            className="mt-4"
          />

          <View className="flex-row items-center justify-center mt-6">
            <Text className="text-gray-500">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            </Text>
            <Pressable onPress={toggleMode}>
              <Text className="text-sky-600 font-semibold">
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
