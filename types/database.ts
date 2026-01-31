export interface Vendor {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  rating: number;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image_url: string | null;
  display_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  vendor_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  price_per_kg: number;
  stock_kg: number;
  min_order_kg: number;
  is_featured: boolean;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  vendors?: Vendor;
  categories?: Category;
}

export interface DeliveryPinCode {
  pin_code: string;
  area_name: string;
  city: string;
  is_active: boolean;
  delivery_charge: number;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  referral_code: string;
  referred_by: string | null;
  wallet_balance: number;
  referral_count: number;
  first_order_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pin_code: string;
  is_default: boolean;
  created_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity_kg: number;
  created_at: string;
  updated_at: string;
  products?: Product & { vendors?: Vendor };
}

export interface Coupon {
  code: string;
  description: string | null;
  discount_type: 'flat' | 'percent';
  discount_value: number;
  min_order_amount: number;
  max_discount: number | null;
  is_active: boolean;
  usage_limit: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
}

export interface DeliveryAddress {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pin_code: string;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  delivery_charge: number;
  coupon_code: string | null;
  coupon_discount: number;
  wallet_used: number;
  total: number;
  payment_method: 'razorpay' | 'cod';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_id: string | null;
  delivery_address: DeliveryAddress;
  expected_delivery: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  vendor_name: string;
  image_url: string | null;
  quantity_kg: number;
  price_per_kg: number;
  total: number;
  created_at: string;
}

export interface CouponValidationResult {
  valid: boolean;
  message: string;
  discount: number;
}

export interface StockDeductionResult {
  success: boolean;
  product_name: string;
  available_stock: number;
}
