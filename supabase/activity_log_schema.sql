-- ============================================
-- Activity Log Table untuk NexSight Dashboard
-- IMPORTANT: Table ini harus dibuat di SUPABASE UTAMA (bukan Supabase Data)
-- Gunakan NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY
-- ============================================

CREATE TABLE IF NOT EXISTS sight_activity_log (
  id BIGSERIAL PRIMARY KEY,
  user_name VARCHAR(255) NOT NULL,
  user_id BIGINT,
  action VARCHAR(100) NOT NULL, -- e.g., 'Login', 'Created User', 'Updated Profile', 'Deleted User', etc.
  target VARCHAR(100), -- e.g., 'System', 'User Management', 'Profile', 'Settings', etc.
  ip_address VARCHAR(45), -- IPv4 or IPv6
  user_agent TEXT,
  details JSONB, -- Additional details as JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_sight_activity_log_user_id ON sight_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_sight_activity_log_user_name ON sight_activity_log(user_name);
CREATE INDEX IF NOT EXISTS idx_sight_activity_log_action ON sight_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_sight_activity_log_target ON sight_activity_log(target);
CREATE INDEX IF NOT EXISTS idx_sight_activity_log_created_at ON sight_activity_log(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE sight_activity_log ENABLE ROW LEVEL SECURITY;

-- Drop policies jika sudah ada (untuk menghindari error duplikasi)
DROP POLICY IF EXISTS "Allow authenticated users to read activity log" ON sight_activity_log;
DROP POLICY IF EXISTS "Allow authenticated users to insert activity log" ON sight_activity_log;

-- Policy untuk SELECT (semua user yang authenticated bisa read)
CREATE POLICY "Allow authenticated users to read activity log" ON sight_activity_log
  FOR SELECT
  USING (true);

-- Policy untuk INSERT (semua user yang authenticated bisa insert)
CREATE POLICY "Allow authenticated users to insert activity log" ON sight_activity_log
  FOR INSERT
  WITH CHECK (true);
