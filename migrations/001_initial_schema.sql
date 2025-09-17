-- Migration 001: Initial schema for Smart Cloud Dashboard
-- Created: 2025-09-14
-- Description: Creates products table with proper constraints and sample data

-- Create products table with e-commerce fields
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL CHECK (length(name) > 0),
  price INTEGER NOT NULL CHECK (price >= 0), -- Price in paise/cents for accuracy
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  inventory INTEGER NOT NULL DEFAULT 100 CHECK (inventory >= 0),
  category VARCHAR(100) NOT NULL DEFAULT 'electronics',
  image_url TEXT,
  description TEXT,
  brand VARCHAR(100),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Insert sample e-commerce products
INSERT INTO products (name, price, currency, inventory, category, brand, description) VALUES 
  ('iPhone 15 Pro Max', 159900, 'INR', 50, 'smartphones', 'Apple', 'Latest flagship smartphone with titanium design'),
  ('MacBook Pro M3', 199900, 'INR', 25, 'laptops', 'Apple', 'Powerful laptop for professionals'),
  ('Samsung Galaxy S24', 74900, 'INR', 80, 'smartphones', 'Samsung', 'Premium Android smartphone'),
  ('Dell XPS 13', 89900, 'INR', 30, 'laptops', 'Dell', 'Ultrabook with stunning display'),
  ('Sony WH-1000XM5', 34900, 'INR', 100, 'audio', 'Sony', 'Industry-leading noise canceling headphones'),
  ('iPad Air M2', 59900, 'INR', 40, 'tablets', 'Apple', 'Versatile tablet for creativity and productivity'),
  ('AirPods Pro 2', 24900, 'INR', 150, 'audio', 'Apple', 'Active noise cancellation wireless earbuds'),
  ('HP Pavilion Gaming', 64900, 'INR', 35, 'laptops', 'HP', 'Gaming laptop with RTX graphics'),
  ('OnePlus 12', 64900, 'INR', 60, 'smartphones', 'OnePlus', 'Flagship killer with fast charging'),
  ('Lenovo ThinkPad X1', 149900, 'INR', 20, 'laptops', 'Lenovo', 'Business laptop with premium build')
ON CONFLICT (id) DO NOTHING;

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create cart tables for e-commerce demo
CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  added_price INTEGER NOT NULL, -- Price when added to cart
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  mode TEXT NOT NULL CHECK (mode IN ('fresh', 'fast', 'smart')), -- How price was fetched
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  cart_id UUID REFERENCES carts(id),
  total_amount INTEGER NOT NULL,
  price_changes JSONB, -- Store any price changes at checkout
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for cart operations
CREATE INDEX IF NOT EXISTS idx_carts_session_id ON carts(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- Grant necessary permissions (adjust for your setup)
-- Note: Run these only if using custom roles
-- GRANT SELECT, INSERT, UPDATE ON products TO authenticated;
-- GRANT USAGE ON SEQUENCE products_id_seq TO authenticated;