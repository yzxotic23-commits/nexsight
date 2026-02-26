-- ============================================
-- Supabase Schema untuk NexSight Dashboard
-- ============================================

-- Tabel untuk Brand & Market Mapping (Menu General)
-- Nama tabel: sight_general_brand_market_mapping
CREATE TABLE IF NOT EXISTS sight_general_brand_market_mapping (
  id BIGSERIAL PRIMARY KEY,
  brand VARCHAR(255) NOT NULL,
  market VARCHAR(10) NOT NULL CHECK (market IN ('SGD', 'MYR', 'USC')),
  status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255),
  updated_by VARCHAR(255)
);

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_sight_general_brand_market_mapping_brand ON sight_general_brand_market_mapping(brand);
CREATE INDEX IF NOT EXISTS idx_sight_general_brand_market_mapping_market ON sight_general_brand_market_mapping(market);
CREATE INDEX IF NOT EXISTS idx_sight_general_brand_market_mapping_status ON sight_general_brand_market_mapping(status);

-- Function untuk auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger jika sudah ada (untuk menghindari error duplikasi)
DROP TRIGGER IF EXISTS update_sight_general_brand_market_mapping_updated_at ON sight_general_brand_market_mapping;

-- Trigger untuk auto-update updated_at
CREATE TRIGGER update_sight_general_brand_market_mapping_updated_at
  BEFORE UPDATE ON sight_general_brand_market_mapping
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE sight_general_brand_market_mapping ENABLE ROW LEVEL SECURITY;

-- Drop policies jika sudah ada (untuk menghindari error duplikasi)
DROP POLICY IF EXISTS "Allow authenticated users to read brand market mapping" ON sight_general_brand_market_mapping;
DROP POLICY IF EXISTS "Allow authenticated users to insert brand market mapping" ON sight_general_brand_market_mapping;
DROP POLICY IF EXISTS "Allow authenticated users to update brand market mapping" ON sight_general_brand_market_mapping;
DROP POLICY IF EXISTS "Allow authenticated users to delete brand market mapping" ON sight_general_brand_market_mapping;

-- Policy untuk SELECT (semua user yang authenticated bisa read)
CREATE POLICY "Allow authenticated users to read brand market mapping"
  ON sight_general_brand_market_mapping
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy untuk INSERT (semua user yang authenticated bisa insert)
CREATE POLICY "Allow authenticated users to insert brand market mapping"
  ON sight_general_brand_market_mapping
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy untuk UPDATE (semua user yang authenticated bisa update)
CREATE POLICY "Allow authenticated users to update brand market mapping"
  ON sight_general_brand_market_mapping
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy untuk DELETE (semua user yang authenticated bisa delete)
CREATE POLICY "Allow authenticated users to delete brand market mapping"
  ON sight_general_brand_market_mapping
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- Tabel untuk User Management
-- Nama tabel: sight_user_management
-- ============================================
CREATE TABLE IF NOT EXISTS sight_user_management (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'User' CHECK (role IN ('Admin', 'Manager', 'User')),
  status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255),
  updated_by VARCHAR(255)
);

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_sight_user_management_email ON sight_user_management(email);
CREATE INDEX IF NOT EXISTS idx_sight_user_management_username ON sight_user_management(username);
CREATE INDEX IF NOT EXISTS idx_sight_user_management_role ON sight_user_management(role);
CREATE INDEX IF NOT EXISTS idx_sight_user_management_status ON sight_user_management(status);

-- Drop trigger jika sudah ada (untuk menghindari error duplikasi)
DROP TRIGGER IF EXISTS update_sight_user_management_updated_at ON sight_user_management;

-- Trigger untuk auto-update updated_at
CREATE TRIGGER update_sight_user_management_updated_at
  BEFORE UPDATE ON sight_user_management
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE sight_user_management ENABLE ROW LEVEL SECURITY;

-- Drop policies jika sudah ada (untuk menghindari error duplikasi)
DROP POLICY IF EXISTS "Allow authenticated users to read user management" ON sight_user_management;
DROP POLICY IF EXISTS "Allow authenticated users to insert user management" ON sight_user_management;
DROP POLICY IF EXISTS "Allow authenticated users to update user management" ON sight_user_management;
DROP POLICY IF EXISTS "Allow authenticated users to delete user management" ON sight_user_management;

-- Policy untuk SELECT (semua user yang authenticated bisa read)
CREATE POLICY "Allow authenticated users to read user management"
  ON sight_user_management
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy untuk INSERT (semua user yang authenticated bisa insert)
CREATE POLICY "Allow authenticated users to insert user management"
  ON sight_user_management
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy untuk UPDATE (semua user yang authenticated bisa update)
CREATE POLICY "Allow authenticated users to update user management"
  ON sight_user_management
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy untuk DELETE (semua user yang authenticated bisa delete)
CREATE POLICY "Allow authenticated users to delete user management"
  ON sight_user_management
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- Insert Default Admin User
-- User admin default yang tidak bisa di-edit atau di-delete
-- ============================================
INSERT INTO sight_user_management (name, email, username, password_hash, role, status, created_by)
VALUES (
  'Admin',
  'admin@nexsight.com',
  'admin',
  'admin', -- TODO: Hash password dengan bcrypt untuk production
  'Admin',
  'Active',
  'system'
)
ON CONFLICT (email) DO NOTHING; -- Jangan insert jika email sudah ada

-- ============================================
-- CATATAN PENTING:
-- ============================================
-- 1. Jalankan script ini di Supabase SQL Editor
-- 2. Pastikan RLS (Row Level Security) sudah di-enable
-- 3. Sesuaikan policies sesuai kebutuhan security Anda
-- 4. Untuk production, pertimbangkan untuk membatasi akses berdasarkan role user
-- 5. Password harus di-hash sebelum disimpan (gunakan bcrypt atau library hashing lainnya)
-- 6. User admin default (username: admin, password: admin) tidak bisa di-edit atau di-delete