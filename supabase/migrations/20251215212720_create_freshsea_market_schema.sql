/*
  # FreshSea Market Database Schema

  1. New Tables
    - `vendors` - Seafood vendor information
      - `id` (uuid, primary key)
      - `name` (text) - Vendor business name
      - `description` (text) - About the vendor
      - `logo_url` (text) - Vendor logo
      - `rating` (numeric) - Average rating
      - `is_active` (boolean) - Whether vendor is active
      - `created_at` (timestamptz)

    - `categories` - Product categories
      - `id` (uuid, primary key)
      - `name` (text) - Category name (Fish, Prawns, etc.)
      - `slug` (text) - URL-friendly name
      - `icon` (text) - Icon identifier
      - `display_order` (integer) - Sort order
      - `created_at` (timestamptz)

    - `products` - Seafood products
      - `id` (uuid, primary key)
      - `vendor_id` (uuid, FK to vendors)
      - `category_id` (uuid, FK to categories)
      - `name` (text) - Product name
      - `description` (text) - Product details
      - `image_url` (text) - Product image
      - `price_per_kg` (numeric) - Price per kilogram
      - `stock_kg` (numeric) - Available stock in kg
      - `min_order_kg` (numeric) - Minimum order (default 0.5)
      - `is_featured` (boolean) - Featured product flag
      - `is_available` (boolean) - Availability flag
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `delivery_pin_codes` - Serviceable areas
      - `pin_code` (text, primary key)
      - `area_name` (text) - Area/locality name
      - `city` (text) - City name
      - `is_active` (boolean) - Whether delivery is available
      - `delivery_charge` (numeric) - Delivery fee
      - `created_at` (timestamptz)

    - `profiles` - Extended user profiles
      - `id` (uuid, primary key, FK to auth.users)
      - `full_name` (text) - User's full name
      - `phone` (text) - Phone number
      - `referral_code` (text, unique) - 8-char uppercase code
      - `referred_by` (uuid, FK to profiles) - Who referred this user
      - `wallet_balance` (numeric) - Wallet balance in rupees
      - `referral_count` (integer) - Number of successful referrals
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `addresses` - User delivery addresses
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK to auth.users)
      - `full_name` (text) - Recipient name
      - `phone` (text) - Contact number
      - `address_line1` (text) - Street address
      - `address_line2` (text) - Apartment, suite, etc.
      - `city` (text) - City
      - `state` (text) - State
      - `pin_code` (text) - Postal code
      - `is_default` (boolean) - Default address flag
      - `created_at` (timestamptz)

    - `cart_items` - Shopping cart
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK to auth.users)
      - `product_id` (uuid, FK to products)
      - `quantity_kg` (numeric) - Quantity in kg
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `coupons` - Discount coupons
      - `code` (text, primary key)
      - `description` (text) - Coupon description
      - `discount_type` (text) - 'flat' or 'percent'
      - `discount_value` (numeric) - Discount amount or percentage
      - `min_order_amount` (numeric) - Minimum order value
      - `max_discount` (numeric) - Max discount for percent type
      - `is_active` (boolean) - Active status
      - `usage_limit` (integer) - Total usage limit
      - `used_count` (integer) - Times used
      - `valid_from` (timestamptz) - Start date
      - `valid_until` (timestamptz) - End date
      - `created_at` (timestamptz)

    - `orders` - Customer orders
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK to auth.users)
      - `order_number` (text, unique) - Human-readable order ID
      - `status` (text) - Order status
      - `subtotal` (numeric) - Items total
      - `delivery_charge` (numeric) - Delivery fee
      - `coupon_code` (text) - Applied coupon
      - `coupon_discount` (numeric) - Coupon discount amount
      - `wallet_used` (numeric) - Wallet amount used
      - `total` (numeric) - Final total
      - `payment_method` (text) - 'razorpay' or 'cod'
      - `payment_status` (text) - Payment status
      - `payment_id` (text) - Razorpay payment ID
      - `delivery_address` (jsonb) - Snapshot of delivery address
      - `expected_delivery` (date) - Expected delivery date
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `order_items` - Items in each order
      - `id` (uuid, primary key)
      - `order_id` (uuid, FK to orders)
      - `product_id` (uuid, FK to products)
      - `product_name` (text) - Snapshot of product name
      - `vendor_name` (text) - Snapshot of vendor name
      - `quantity_kg` (numeric) - Ordered quantity
      - `price_per_kg` (numeric) - Price at time of order
      - `total` (numeric) - Line item total
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Public read access for vendors, categories, products, delivery_pin_codes
    - Authenticated user access for own profile, cart, addresses, orders
    - Coupons readable by all, modifiable only by service role

  3. Functions
    - generate_referral_code() - Creates unique 8-char code
    - generate_order_number() - Creates readable order number
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  logo_url text,
  rating numeric(2,1) DEFAULT 4.0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active vendors"
  ON vendors FOR SELECT
  USING (is_active = true);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text,
  image_url text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  USING (true);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  image_url text,
  price_per_kg numeric(10,2) NOT NULL,
  stock_kg numeric(10,2) DEFAULT 0,
  min_order_kg numeric(10,2) DEFAULT 0.5,
  is_featured boolean DEFAULT false,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available products"
  ON products FOR SELECT
  USING (is_available = true);

-- Delivery pin codes table
CREATE TABLE IF NOT EXISTS delivery_pin_codes (
  pin_code text PRIMARY KEY,
  area_name text NOT NULL,
  city text NOT NULL,
  is_active boolean DEFAULT true,
  delivery_charge numeric(10,2) DEFAULT 40,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE delivery_pin_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active delivery areas"
  ON delivery_pin_codes FOR SELECT
  USING (is_active = true);

-- Function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  referral_code text UNIQUE DEFAULT generate_referral_code(),
  referred_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  wallet_balance numeric(10,2) DEFAULT 0,
  referral_count integer DEFAULT 0,
  first_order_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow reading referral codes for validation
CREATE POLICY "Anyone can lookup referral codes"
  ON profiles FOR SELECT
  USING (referral_code IS NOT NULL);

-- Addresses table
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  pin_code text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own addresses"
  ON addresses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses"
  ON addresses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses"
  ON addresses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses"
  ON addresses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity_kg numeric(10,2) NOT NULL DEFAULT 0.5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cart"
  ON cart_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own cart"
  ON cart_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart"
  ON cart_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from own cart"
  ON cart_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
  code text PRIMARY KEY,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('flat', 'percent')),
  discount_value numeric(10,2) NOT NULL,
  min_order_amount numeric(10,2) DEFAULT 0,
  max_discount numeric(10,2),
  is_active boolean DEFAULT true,
  usage_limit integer,
  used_count integer DEFAULT 0,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupons"
  ON coupons FOR SELECT
  USING (is_active = true);

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
BEGIN
  RETURN 'FSM-' || to_char(now(), 'YYYYMMDD') || '-' || 
         upper(substr(md5(random()::text), 1, 6));
END;
$$ LANGUAGE plpgsql;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  order_number text UNIQUE DEFAULT generate_order_number(),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  subtotal numeric(10,2) NOT NULL,
  delivery_charge numeric(10,2) DEFAULT 0,
  coupon_code text,
  coupon_discount numeric(10,2) DEFAULT 0,
  wallet_used numeric(10,2) DEFAULT 0,
  total numeric(10,2) NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('razorpay', 'cod')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_id text,
  delivery_address jsonb NOT NULL,
  expected_delivery date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  vendor_name text NOT NULL,
  image_url text,
  quantity_kg numeric(10,2) NOT NULL,
  price_per_kg numeric(10,2) NOT NULL,
  total numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- RPC function for atomic stock deduction
CREATE OR REPLACE FUNCTION deduct_stock(
  p_product_id uuid,
  p_quantity numeric
)
RETURNS TABLE(success boolean, product_name text, available_stock numeric) AS $$
DECLARE
  v_product products%ROWTYPE;
BEGIN
  SELECT * INTO v_product FROM products WHERE id = p_product_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Product not found'::text, 0::numeric;
    RETURN;
  END IF;
  
  IF v_product.stock_kg < p_quantity THEN
    RETURN QUERY SELECT false, v_product.name, v_product.stock_kg;
    RETURN;
  END IF;
  
  UPDATE products 
  SET stock_kg = stock_kg - p_quantity, updated_at = now()
  WHERE id = p_product_id;
  
  RETURN QUERY SELECT true, v_product.name, (v_product.stock_kg - p_quantity)::numeric;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function for referral rewards (atomic wallet update)
CREATE OR REPLACE FUNCTION process_referral_reward(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_referrer profiles%ROWTYPE;
  v_reward_amount numeric := 100;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id FOR UPDATE;
  
  IF NOT FOUND OR v_profile.first_order_completed THEN
    RETURN false;
  END IF;
  
  UPDATE profiles 
  SET first_order_completed = true, updated_at = now()
  WHERE id = p_user_id;
  
  IF v_profile.referred_by IS NOT NULL THEN
    SELECT * INTO v_referrer FROM profiles WHERE id = v_profile.referred_by FOR UPDATE;
    
    IF FOUND AND v_referrer.referral_count < 10 THEN
      UPDATE profiles 
      SET wallet_balance = wallet_balance + v_reward_amount,
          referral_count = referral_count + 1,
          updated_at = now()
      WHERE id = v_profile.referred_by;
      
      UPDATE profiles 
      SET wallet_balance = wallet_balance + v_reward_amount,
          updated_at = now()
      WHERE id = p_user_id;
    END IF;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to validate and apply coupon
CREATE OR REPLACE FUNCTION validate_coupon(
  p_code text,
  p_order_amount numeric
)
RETURNS TABLE(valid boolean, message text, discount numeric) AS $$
DECLARE
  v_coupon coupons%ROWTYPE;
  v_discount numeric;
BEGIN
  SELECT * INTO v_coupon FROM coupons WHERE code = upper(p_code);
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid coupon code'::text, 0::numeric;
    RETURN;
  END IF;
  
  IF NOT v_coupon.is_active THEN
    RETURN QUERY SELECT false, 'This coupon is no longer active'::text, 0::numeric;
    RETURN;
  END IF;
  
  IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < now() THEN
    RETURN QUERY SELECT false, 'This coupon has expired'::text, 0::numeric;
    RETURN;
  END IF;
  
  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.used_count >= v_coupon.usage_limit THEN
    RETURN QUERY SELECT false, 'This coupon has reached its usage limit'::text, 0::numeric;
    RETURN;
  END IF;
  
  IF p_order_amount < v_coupon.min_order_amount THEN
    RETURN QUERY SELECT false, ('Minimum order amount is Rs.' || v_coupon.min_order_amount)::text, 0::numeric;
    RETURN;
  END IF;
  
  IF v_coupon.discount_type = 'flat' THEN
    v_discount := v_coupon.discount_value;
  ELSE
    v_discount := (p_order_amount * v_coupon.discount_value / 100);
    IF v_coupon.max_discount IS NOT NULL AND v_discount > v_coupon.max_discount THEN
      v_discount := v_coupon.max_discount;
    END IF;
  END IF;
  
  RETURN QUERY SELECT true, v_coupon.description, v_discount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to deduct wallet balance
CREATE OR REPLACE FUNCTION deduct_wallet(
  p_user_id uuid,
  p_amount numeric
)
RETURNS boolean AS $$
BEGIN
  UPDATE profiles 
  SET wallet_balance = wallet_balance - p_amount,
      updated_at = now()
  WHERE id = p_user_id AND wallet_balance >= p_amount;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Increment coupon usage
CREATE OR REPLACE FUNCTION increment_coupon_usage(p_code text)
RETURNS void AS $$
BEGIN
  UPDATE coupons SET used_count = used_count + 1 WHERE code = upper(p_code);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
