/*
  # Drop All Existing Tables and Functions
  
  This migration drops all existing tables, functions, and triggers to start fresh.
*/

-- Drop all tables
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS delivery_pin_codes CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS generate_referral_code() CASCADE;
DROP FUNCTION IF EXISTS generate_order_number() CASCADE;
DROP FUNCTION IF EXISTS deduct_stock(uuid, numeric) CASCADE;
DROP FUNCTION IF EXISTS process_referral_reward(uuid) CASCADE;
DROP FUNCTION IF EXISTS validate_coupon(text, numeric) CASCADE;
DROP FUNCTION IF EXISTS deduct_wallet(uuid, numeric) CASCADE;
DROP FUNCTION IF EXISTS increment_coupon_usage(text) CASCADE;
