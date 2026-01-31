/*
  # Complete FreshSea Market Database Schema - Fresh Install

  1. Tables
    - vendors: Seafood vendors
    - categories: Product categories  
    - products: Seafood products with stock tracking
    - delivery_pin_codes: Serviceable delivery areas
    - profiles: Extended user profiles with referral & wallet
    - addresses: User delivery addresses
    - cart_items: Shopping cart
    - coupons: Discount coupons
    - orders: Customer orders
    - order_items: Line items in orders

  2. Functions
    - generate_referral_code(): Creates unique 8-char referral codes
    - generate_order_number(): Creates readable order numbers
    - deduct_stock(): Atomic stock deduction with validation
    - process_referral_reward(): Awards referral bonuses on first order
    - validate_coupon(): Validates and calculates coupon discounts
    - deduct_wallet(): Deducts wallet balance atomically
    - increment_coupon_usage(): Increments coupon usage counter
    - handle_new_user(): Auto-creates profile on signup

  3. Security
    - RLS enabled on all tables
    - Appropriate policies for authenticated and anonymous access
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- VENDORS TABLE
-- ============================================================================
CREATE TABLE vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  logo_url text,
  rating numeric(2,1) DEFAULT 4.0 CHECK (rating >= 0 AND rating <= 5),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active vendors"
  ON vendors FOR SELECT
  USING (is_active = true);

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================
CREATE TABLE categories (
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

-- ============================================================================
-- PRODUCTS TABLE
-- ============================================================================
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  image_url text,
  price_per_kg numeric(10,2) NOT NULL CHECK (price_per_kg >= 0),
  stock_kg numeric(10,2) DEFAULT 0 CHECK (stock_kg >= 0),
  min_order_kg numeric(10,2) DEFAULT 0.5 CHECK (min_order_kg > 0),
  is_featured boolean DEFAULT false,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_vendor ON products(vendor_id);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_available ON products(is_available) WHERE is_available = true;

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available products"
  ON products FOR SELECT
  USING (is_available = true);

-- ============================================================================
-- DELIVERY PIN CODES TABLE
-- ============================================================================
CREATE TABLE delivery_pin_codes (
  pin_code text PRIMARY KEY,
  area_name text NOT NULL,
  city text NOT NULL,
  is_active boolean DEFAULT true,
  delivery_charge numeric(10,2) DEFAULT 40 CHECK (delivery_charge >= 0),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE delivery_pin_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active delivery areas"
  ON delivery_pin_codes FOR SELECT
  USING (is_active = true);

-- ============================================================================
-- HELPER FUNCTION: Generate Referral Code
-- ============================================================================
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
$$ LANGUAGE plpgsql VOLATILE;

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  referral_code text UNIQUE NOT NULL DEFAULT generate_referral_code(),
  referred_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  wallet_balance numeric(10,2) DEFAULT 0 CHECK (wallet_balance >= 0),
  referral_count integer DEFAULT 0 CHECK (referral_count >= 0 AND referral_count <= 10),
  first_order_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT no_self_referral CHECK (id != referred_by)
);

CREATE INDEX idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX idx_profiles_referred_by ON profiles(referred_by);

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

CREATE POLICY "Anyone can lookup referral codes"
  ON profiles FOR SELECT
  USING (referral_code IS NOT NULL);

-- ============================================================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- ADDRESSES TABLE
-- ============================================================================
CREATE TABLE addresses (
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

CREATE INDEX idx_addresses_user ON addresses(user_id);

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

-- ============================================================================
-- CART ITEMS TABLE
-- ============================================================================
CREATE TABLE cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity_kg numeric(10,2) NOT NULL DEFAULT 0.5 CHECK (quantity_kg > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_cart_product ON cart_items(product_id);

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

-- ============================================================================
-- COUPONS TABLE
-- ============================================================================
CREATE TABLE coupons (
  code text PRIMARY KEY,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('flat', 'percent')),
  discount_value numeric(10,2) NOT NULL CHECK (discount_value >= 0),
  min_order_amount numeric(10,2) DEFAULT 0 CHECK (min_order_amount >= 0),
  max_discount numeric(10,2) CHECK (max_discount >= 0),
  is_active boolean DEFAULT true,
  usage_limit integer CHECK (usage_limit > 0),
  used_count integer DEFAULT 0 CHECK (used_count >= 0),
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (valid_until IS NULL OR valid_until > valid_from)
);

CREATE INDEX idx_coupons_active ON coupons(is_active) WHERE is_active = true;

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupons"
  ON coupons FOR SELECT
  USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

-- ============================================================================
-- HELPER FUNCTION: Generate Order Number
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
BEGIN
  RETURN 'FSM-' || to_char(now(), 'YYYYMMDD') || '-' || 
         upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ============================================================================
-- ORDERS TABLE
-- ============================================================================
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  order_number text UNIQUE NOT NULL DEFAULT generate_order_number(),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  subtotal numeric(10,2) NOT NULL CHECK (subtotal >= 0),
  delivery_charge numeric(10,2) DEFAULT 0 CHECK (delivery_charge >= 0),
  coupon_code text,
  coupon_discount numeric(10,2) DEFAULT 0 CHECK (coupon_discount >= 0),
  wallet_used numeric(10,2) DEFAULT 0 CHECK (wallet_used >= 0),
  total numeric(10,2) NOT NULL CHECK (total >= 0),
  payment_method text NOT NULL CHECK (payment_method IN ('razorpay', 'cod')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_id text,
  delivery_address jsonb NOT NULL,
  expected_delivery date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

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

-- ============================================================================
-- ORDER ITEMS TABLE
-- ============================================================================
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  vendor_name text NOT NULL,
  image_url text,
  quantity_kg numeric(10,2) NOT NULL CHECK (quantity_kg > 0),
  price_per_kg numeric(10,2) NOT NULL CHECK (price_per_kg >= 0),
  total numeric(10,2) NOT NULL CHECK (total >= 0),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

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

-- ============================================================================
-- RPC: Atomic Stock Deduction
-- ============================================================================
CREATE OR REPLACE FUNCTION deduct_stock(
  p_product_id uuid,
  p_quantity numeric
)
RETURNS TABLE(success boolean, product_name text, available_stock numeric) AS $$
DECLARE
  v_product_name text;
  v_current_stock numeric;
BEGIN
  SELECT name, stock_kg INTO v_product_name, v_current_stock
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Product not found'::text, 0::numeric;
    RETURN;
  END IF;
  
  IF v_current_stock < p_quantity THEN
    RETURN QUERY SELECT false, v_product_name, v_current_stock;
    RETURN;
  END IF;
  
  UPDATE products 
  SET stock_kg = stock_kg - p_quantity, 
      updated_at = now()
  WHERE id = p_product_id;
  
  RETURN QUERY SELECT true, v_product_name, (v_current_stock - p_quantity)::numeric;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: Process Referral Reward
-- ============================================================================
CREATE OR REPLACE FUNCTION process_referral_reward(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_referred_by uuid;
  v_first_order_completed boolean;
  v_referrer_count integer;
  v_reward_amount numeric := 100;
BEGIN
  SELECT referred_by, first_order_completed
  INTO v_referred_by, v_first_order_completed
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND OR v_first_order_completed THEN
    RETURN false;
  END IF;
  
  UPDATE profiles 
  SET first_order_completed = true, 
      updated_at = now()
  WHERE id = p_user_id;
  
  IF v_referred_by IS NOT NULL THEN
    SELECT referral_count INTO v_referrer_count
    FROM profiles
    WHERE id = v_referred_by
    FOR UPDATE;
    
    IF FOUND AND v_referrer_count < 10 THEN
      UPDATE profiles 
      SET wallet_balance = wallet_balance + v_reward_amount,
          referral_count = referral_count + 1,
          updated_at = now()
      WHERE id = v_referred_by;
      
      UPDATE profiles 
      SET wallet_balance = wallet_balance + v_reward_amount,
          updated_at = now()
      WHERE id = p_user_id;
    END IF;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: Validate Coupon
-- ============================================================================
CREATE OR REPLACE FUNCTION validate_coupon(
  p_code text,
  p_order_amount numeric
)
RETURNS TABLE(valid boolean, message text, discount numeric) AS $$
DECLARE
  v_coupon coupons%ROWTYPE;
  v_discount numeric;
BEGIN
  SELECT * INTO v_coupon 
  FROM coupons 
  WHERE code = upper(p_code);
  
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
  
  RETURN QUERY SELECT true, COALESCE(v_coupon.description, 'Coupon applied successfully'), v_discount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: Deduct Wallet Balance
-- ============================================================================
CREATE OR REPLACE FUNCTION deduct_wallet(
  p_user_id uuid,
  p_amount numeric
)
RETURNS boolean AS $$
DECLARE
  v_balance numeric;
BEGIN
  SELECT wallet_balance INTO v_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND OR v_balance < p_amount THEN
    RETURN false;
  END IF;
  
  UPDATE profiles 
  SET wallet_balance = wallet_balance - p_amount,
      updated_at = now()
  WHERE id = p_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: Increment Coupon Usage
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_coupon_usage(p_code text)
RETURNS void AS $$
BEGIN
  UPDATE coupons 
  SET used_count = used_count + 1 
  WHERE code = upper(p_code);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
