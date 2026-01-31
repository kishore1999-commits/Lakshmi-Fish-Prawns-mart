import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { CartItem, Product } from '@/types/database';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  itemCount: number;
  subtotal: number;
  addToCart: (productId: string, quantity: number) => Promise<{ error: Error | null }>;
  updateQuantity: (itemId: string, quantity: number) => Promise<{ error: Error | null }>;
  removeFromCart: (itemId: string) => Promise<{ error: Error | null }>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          products (
            *,
            vendors (*)
          )
        `)
        .eq('user_id', user.id);

      if (!error && data) {
        setItems(data as CartItem[]);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const refreshCart = async () => {
    await fetchCart();
  };

  const addToCart = async (productId: string, quantity: number) => {
    if (!user) {
      return { error: new Error('Please sign in to add items to cart') };
    }

    try {
      const existing = items.find(item => item.product_id === productId);

      if (existing) {
        const newQuantity = existing.quantity_kg + quantity;
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity_kg: newQuantity, updated_at: new Date().toISOString() })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity_kg: quantity,
          });

        if (error) throw error;
      }

      await fetchCart();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        return removeFromCart(itemId);
      }

      const { error } = await supabase
        .from('cart_items')
        .update({ quantity_kg: quantity, updated_at: new Date().toISOString() })
        .eq('id', itemId);

      if (error) throw error;
      await fetchCart();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      await fetchCart();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const clearCart = async () => {
    if (!user) return;

    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    setItems([]);
  };

  const itemCount = items.reduce((sum, item) => sum + 1, 0);
  const subtotal = items.reduce((sum, item) => {
    const price = item.products?.price_per_kg || 0;
    return sum + (price * item.quantity_kg);
  }, 0);

  return (
    <CartContext.Provider value={{
      items,
      loading,
      itemCount,
      subtotal,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      refreshCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
