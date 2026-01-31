/*
  # Seed Initial Data for FreshSea Market

  1. Vendors - Sample seafood vendors
  2. Categories - Fish, Prawns, Crabs, Others
  3. Products - Various seafood products
  4. Delivery Pin Codes - Sample serviceable areas
  5. Coupons - Sample discount coupons
*/

-- Insert vendors
INSERT INTO vendors (id, name, description, logo_url, rating) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Ocean Fresh Fisheries', 'Premium quality seafood direct from the coast', 'https://images.pexels.com/photos/3731256/pexels-photo-3731256.jpeg?auto=compress&cs=tinysrgb&w=100', 4.8),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Coastal Catch', 'Fresh catch delivered daily from local fishermen', 'https://images.pexels.com/photos/2871757/pexels-photo-2871757.jpeg?auto=compress&cs=tinysrgb&w=100', 4.6),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Sea King Exports', 'Export quality seafood at local prices', 'https://images.pexels.com/photos/3296434/pexels-photo-3296434.jpeg?auto=compress&cs=tinysrgb&w=100', 4.7)
ON CONFLICT DO NOTHING;

-- Insert categories
INSERT INTO categories (id, name, slug, icon, image_url, display_order) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Fish', 'fish', 'fish', 'https://images.pexels.com/photos/3296392/pexels-photo-3296392.jpeg?auto=compress&cs=tinysrgb&w=400', 1),
  ('22222222-2222-2222-2222-222222222222', 'Prawns', 'prawns', 'shrimp', 'https://images.pexels.com/photos/725992/pexels-photo-725992.jpeg?auto=compress&cs=tinysrgb&w=400', 2),
  ('33333333-3333-3333-3333-333333333333', 'Crabs', 'crabs', 'crab', 'https://images.pexels.com/photos/2871757/pexels-photo-2871757.jpeg?auto=compress&cs=tinysrgb&w=400', 3),
  ('44444444-4444-4444-4444-444444444444', 'Others', 'others', 'shell', 'https://images.pexels.com/photos/566344/pexels-photo-566344.jpeg?auto=compress&cs=tinysrgb&w=400', 4)
ON CONFLICT DO NOTHING;

-- Insert products
INSERT INTO products (vendor_id, category_id, name, description, image_url, price_per_kg, stock_kg, is_featured) VALUES
  -- Fish
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-1111-1111-1111-111111111111', 'Pomfret (White)', 'Fresh white pomfret, cleaned and ready to cook. Rich in omega-3 fatty acids.', 'https://images.pexels.com/photos/3296392/pexels-photo-3296392.jpeg?auto=compress&cs=tinysrgb&w=600', 850, 25, true),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', '11111111-1111-1111-1111-111111111111', 'Pomfret (Black)', 'Premium black pomfret with firm flesh, perfect for frying.', 'https://images.pexels.com/photos/3731256/pexels-photo-3731256.jpeg?auto=compress&cs=tinysrgb&w=600', 650, 20, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-1111-1111-1111-111111111111', 'Surmai (Kingfish)', 'King of fish! Thick steaks perfect for grilling or curry.', 'https://images.pexels.com/photos/2252584/pexels-photo-2252584.jpeg?auto=compress&cs=tinysrgb&w=600', 750, 30, true),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', '11111111-1111-1111-1111-111111111111', 'Rawas (Indian Salmon)', 'Juicy and flavorful, ideal for steaming or curry.', 'https://images.pexels.com/photos/3296434/pexels-photo-3296434.jpeg?auto=compress&cs=tinysrgb&w=600', 550, 35, false),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', '11111111-1111-1111-1111-111111111111', 'Bangda (Mackerel)', 'Affordable and nutritious, great for frying.', 'https://images.pexels.com/photos/1516415/pexels-photo-1516415.jpeg?auto=compress&cs=tinysrgb&w=600', 220, 50, false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-1111-1111-1111-111111111111', 'Rohu', 'Freshwater favorite, perfect for traditional recipes.', 'https://images.pexels.com/photos/3640451/pexels-photo-3640451.jpeg?auto=compress&cs=tinysrgb&w=600', 280, 40, false),
  
  -- Prawns
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '22222222-2222-2222-2222-222222222222', 'Tiger Prawns (Large)', 'Jumbo tiger prawns, deveined and cleaned. 10-15 count per kg.', 'https://images.pexels.com/photos/725992/pexels-photo-725992.jpeg?auto=compress&cs=tinysrgb&w=600', 1200, 15, true),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', '22222222-2222-2222-2222-222222222222', 'Tiger Prawns (Medium)', 'Medium sized tiger prawns, great for stir-fry. 20-25 count per kg.', 'https://images.pexels.com/photos/566344/pexels-photo-566344.jpeg?auto=compress&cs=tinysrgb&w=600', 850, 25, false),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', '22222222-2222-2222-2222-222222222222', 'White Prawns', 'Sweet and tender white prawns, perfect for curry.', 'https://images.pexels.com/photos/3298182/pexels-photo-3298182.jpeg?auto=compress&cs=tinysrgb&w=600', 650, 30, false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '22222222-2222-2222-2222-222222222222', 'Kolambi (Small Prawns)', 'Small prawns ideal for rice dishes and snacks.', 'https://images.pexels.com/photos/4553111/pexels-photo-4553111.jpeg?auto=compress&cs=tinysrgb&w=600', 450, 40, false),
  
  -- Crabs
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', '33333333-3333-3333-3333-333333333333', 'Mud Crab (Large)', 'Giant mud crabs with sweet, succulent meat. 400-500g each.', 'https://images.pexels.com/photos/2871757/pexels-photo-2871757.jpeg?auto=compress&cs=tinysrgb&w=600', 1400, 10, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '33333333-3333-3333-3333-333333333333', 'Mud Crab (Medium)', 'Medium mud crabs, perfect for crab curry. 250-350g each.', 'https://images.pexels.com/photos/5638732/pexels-photo-5638732.jpeg?auto=compress&cs=tinysrgb&w=600', 950, 15, false),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', '33333333-3333-3333-3333-333333333333', 'Blue Swimmer Crab', 'Delicate blue swimmer crabs, great for soups and stews.', 'https://images.pexels.com/photos/3296395/pexels-photo-3296395.jpeg?auto=compress&cs=tinysrgb&w=600', 750, 20, false),
  
  -- Others
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '44444444-4444-4444-4444-444444444444', 'Squid (Cleaned)', 'Fresh squid rings, cleaned and ready to cook.', 'https://images.pexels.com/photos/4553027/pexels-photo-4553027.jpeg?auto=compress&cs=tinysrgb&w=600', 550, 25, true),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', '44444444-4444-4444-4444-444444444444', 'Oysters (Dozen)', 'Fresh oysters, perfect for grilling or raw.', 'https://images.pexels.com/photos/1148086/pexels-photo-1148086.jpeg?auto=compress&cs=tinysrgb&w=600', 480, 30, false),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', '44444444-4444-4444-4444-444444444444', 'Lobster', 'Premium spiny lobster, live or cleaned.', 'https://images.pexels.com/photos/725991/pexels-photo-725991.jpeg?auto=compress&cs=tinysrgb&w=600', 2500, 8, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '44444444-4444-4444-4444-444444444444', 'Clams', 'Fresh clams, cleaned and ready for cooking.', 'https://images.pexels.com/photos/3296637/pexels-photo-3296637.jpeg?auto=compress&cs=tinysrgb&w=600', 350, 35, false),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', '44444444-4444-4444-4444-444444444444', 'Mussels', 'Black mussels, perfect for pasta and soups.', 'https://images.pexels.com/photos/3298180/pexels-photo-3298180.jpeg?auto=compress&cs=tinysrgb&w=600', 280, 40, false)
ON CONFLICT DO NOTHING;

-- Insert delivery pin codes (Mumbai, Pune, Goa areas)
INSERT INTO delivery_pin_codes (pin_code, area_name, city, delivery_charge) VALUES
  ('400001', 'Fort', 'Mumbai', 40),
  ('400002', 'Kalbadevi', 'Mumbai', 40),
  ('400003', 'Mandvi', 'Mumbai', 40),
  ('400004', 'Girgaon', 'Mumbai', 40),
  ('400005', 'Colaba', 'Mumbai', 40),
  ('400050', 'Bandra West', 'Mumbai', 50),
  ('400051', 'Bandra East', 'Mumbai', 50),
  ('400052', 'Khar', 'Mumbai', 50),
  ('400053', 'Andheri West', 'Mumbai', 60),
  ('400058', 'Andheri East', 'Mumbai', 60),
  ('400069', 'Powai', 'Mumbai', 70),
  ('400076', 'Goregaon', 'Mumbai', 70),
  ('400092', 'Borivali', 'Mumbai', 80),
  ('411001', 'Pune Station', 'Pune', 50),
  ('411002', 'Pune Camp', 'Pune', 50),
  ('411004', 'Deccan', 'Pune', 50),
  ('411005', 'Shivajinagar', 'Pune', 50),
  ('411006', 'Kothrud', 'Pune', 60),
  ('411014', 'Hadapsar', 'Pune', 60),
  ('403001', 'Panaji', 'Goa', 40),
  ('403002', 'Mapusa', 'Goa', 50),
  ('403501', 'Margao', 'Goa', 50),
  ('403516', 'Calangute', 'Goa', 60),
  ('403519', 'Candolim', 'Goa', 60)
ON CONFLICT DO NOTHING;

-- Insert coupons
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount, usage_limit) VALUES
  ('WELCOME50', 'Get Rs.50 off on your first order', 'flat', 50, 300, NULL, 1000),
  ('SEAFOOD20', '20% off on orders above Rs.500', 'percent', 20, 500, 200, 500),
  ('FRESH100', 'Flat Rs.100 off on orders above Rs.800', 'flat', 100, 800, NULL, 200),
  ('PRAWNS15', '15% off on all prawns', 'percent', 15, 400, 150, 300)
ON CONFLICT DO NOTHING;
