-- ============================================================
-- HireOS — Admin Auth Setup
-- Run this in Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- ============================================================
-- 1. user_profiles table
-- Links to Supabase's built-in auth.users table.
-- Stores the role (admin / viewer / etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email    TEXT NOT NULL,
  role     TEXT NOT NULL DEFAULT 'viewer', -- 'admin' | 'viewer'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. Trigger: auto-create a profile row when a user signs up
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    'viewer'  -- default role; promote to 'admin' manually below
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 3. RLS on user_profiles
-- ============================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- ============================================================
-- 4. Create your first admin user
--
-- STEP A: Go to Supabase Dashboard → Authentication → Users
--         → "Add User" → enter email + password → Create
--
-- STEP B: After creating the user, run the query below to
--         promote them to admin. Replace the email address.
-- ============================================================

-- Run this AFTER creating the user in the Dashboard:
UPDATE user_profiles
SET role = 'admin'
WHERE email = 'your-admin@example.com';  -- ← change this

-- ============================================================
-- 5. Verify: check your user_profiles table
-- ============================================================
-- SELECT * FROM user_profiles;
