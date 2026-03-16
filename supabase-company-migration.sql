-- ═══════════════════════════════════════════════════════════
-- FORGED Safety OS — Company/Team Architecture Migration
-- Run this AFTER the base supabase-migration.sql
-- ═══════════════════════════════════════════════════════════

-- Companies table
CREATE TABLE IF NOT EXISTS safety_companies (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  plan TEXT DEFAULT 'starter',
  max_members INTEGER DEFAULT 25,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company members (links users to companies with roles)
CREATE TABLE IF NOT EXISTS safety_company_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT REFERENCES safety_companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  role TEXT DEFAULT 'field',
  status TEXT DEFAULT 'active',
  invited_by UUID,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

-- Add company_id to ALL data tables
DO $$ BEGIN
  ALTER TABLE safety_hazards ADD COLUMN IF NOT EXISTS company_id TEXT;
  ALTER TABLE safety_daily_logs ADD COLUMN IF NOT EXISTS company_id TEXT;
  ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS company_id TEXT;
  ALTER TABLE safety_near_misses ADD COLUMN IF NOT EXISTS company_id TEXT;
  ALTER TABLE safety_projects ADD COLUMN IF NOT EXISTS company_id TEXT;
  ALTER TABLE safety_permits ADD COLUMN IF NOT EXISTS company_id TEXT;
  ALTER TABLE safety_training ADD COLUMN IF NOT EXISTS company_id TEXT;
  ALTER TABLE safety_workers ADD COLUMN IF NOT EXISTS company_id TEXT;
  ALTER TABLE safety_jhas ADD COLUMN IF NOT EXISTS company_id TEXT;
  ALTER TABLE safety_sds ADD COLUMN IF NOT EXISTS company_id TEXT;
  ALTER TABLE safety_lift_plans ADD COLUMN IF NOT EXISTS company_id TEXT;
  ALTER TABLE safety_audits ADD COLUMN IF NOT EXISTS company_id TEXT;
  ALTER TABLE safety_orientations ADD COLUMN IF NOT EXISTS company_id TEXT;
  ALTER TABLE safety_inspections ADD COLUMN IF NOT EXISTS company_id TEXT;
  ALTER TABLE safety_documents ADD COLUMN IF NOT EXISTS company_id TEXT;
  ALTER TABLE safety_photo_analyses ADD COLUMN IF NOT EXISTS company_id TEXT;

  -- Add submitted_by fields for tracking who entered what
  ALTER TABLE safety_hazards ADD COLUMN IF NOT EXISTS submitted_by_name TEXT;
  ALTER TABLE safety_daily_logs ADD COLUMN IF NOT EXISTS submitted_by_name TEXT;
  ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS submitted_by_name TEXT;
  ALTER TABLE safety_near_misses ADD COLUMN IF NOT EXISTS submitted_by_name TEXT;
  ALTER TABLE safety_permits ADD COLUMN IF NOT EXISTS submitted_by_name TEXT;
  ALTER TABLE safety_inspections ADD COLUMN IF NOT EXISTS submitted_by_name TEXT;
  ALTER TABLE safety_jhas ADD COLUMN IF NOT EXISTS submitted_by_name TEXT;
  ALTER TABLE safety_photo_analyses ADD COLUMN IF NOT EXISTS submitted_by_name TEXT;

  -- Add content_lang for translation tracking
  ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS content_lang TEXT DEFAULT 'en';
  ALTER TABLE safety_near_misses ADD COLUMN IF NOT EXISTS content_lang TEXT DEFAULT 'en';
  ALTER TABLE safety_daily_logs ADD COLUMN IF NOT EXISTS content_lang TEXT DEFAULT 'en';
  ALTER TABLE safety_hazards ADD COLUMN IF NOT EXISTS content_lang TEXT DEFAULT 'en';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Enable RLS on new tables
ALTER TABLE safety_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_company_members ENABLE ROW LEVEL SECURITY;

-- Companies: owner can do everything
DO $$ BEGIN
  BEGIN DROP POLICY "safety_companies_select" ON safety_companies; EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN DROP POLICY "safety_companies_insert" ON safety_companies; EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN DROP POLICY "safety_companies_update" ON safety_companies; EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN DROP POLICY "safety_companies_delete" ON safety_companies; EXCEPTION WHEN undefined_object THEN NULL; END;
END $$;

-- Users can see companies they belong to
CREATE POLICY "safety_companies_select" ON safety_companies FOR SELECT
  USING (
    owner_id = auth.uid()
    OR id IN (SELECT company_id FROM safety_company_members WHERE user_id = auth.uid())
  );
CREATE POLICY "safety_companies_insert" ON safety_companies FOR INSERT
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "safety_companies_update" ON safety_companies FOR UPDATE
  USING (owner_id = auth.uid());
CREATE POLICY "safety_companies_delete" ON safety_companies FOR DELETE
  USING (owner_id = auth.uid());

-- Company members: members can see their company's members
DO $$ BEGIN
  BEGIN DROP POLICY "safety_company_members_select" ON safety_company_members; EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN DROP POLICY "safety_company_members_insert" ON safety_company_members; EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN DROP POLICY "safety_company_members_update" ON safety_company_members; EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN DROP POLICY "safety_company_members_delete" ON safety_company_members; EXCEPTION WHEN undefined_object THEN NULL; END;
END $$;

CREATE POLICY "safety_company_members_select" ON safety_company_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR company_id IN (SELECT company_id FROM safety_company_members WHERE user_id = auth.uid())
  );
CREATE POLICY "safety_company_members_insert" ON safety_company_members FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT id FROM safety_companies WHERE owner_id = auth.uid()
      UNION
      SELECT company_id FROM safety_company_members WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
    )
  );
CREATE POLICY "safety_company_members_update" ON safety_company_members FOR UPDATE
  USING (
    company_id IN (
      SELECT id FROM safety_companies WHERE owner_id = auth.uid()
      UNION
      SELECT company_id FROM safety_company_members WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
    )
  );
CREATE POLICY "safety_company_members_delete" ON safety_company_members FOR DELETE
  USING (
    company_id IN (SELECT id FROM safety_companies WHERE owner_id = auth.uid())
  );

-- ═══ UPDATE DATA TABLE RLS ═══
-- Change from "user sees own data" to "user sees company data OR own data (for solo users)"
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'safety_hazards','safety_daily_logs','safety_incidents','safety_near_misses',
    'safety_projects','safety_permits','safety_training','safety_workers',
    'safety_jhas','safety_sds','safety_lift_plans','safety_audits',
    'safety_orientations','safety_inspections','safety_documents','safety_photo_analyses'
  ])
  LOOP
    BEGIN EXECUTE format('DROP POLICY "%s_select" ON %I', t, t); EXCEPTION WHEN undefined_object THEN NULL; END;
    BEGIN EXECUTE format('DROP POLICY "%s_insert" ON %I', t, t); EXCEPTION WHEN undefined_object THEN NULL; END;
    BEGIN EXECUTE format('DROP POLICY "%s_update" ON %I', t, t); EXCEPTION WHEN undefined_object THEN NULL; END;
    BEGIN EXECUTE format('DROP POLICY "%s_delete" ON %I', t, t); EXCEPTION WHEN undefined_object THEN NULL; END;

    -- SELECT: user sees own data OR company data
    EXECUTE format('CREATE POLICY "%s_select" ON %I FOR SELECT USING (
      user_id = auth.uid()
      OR company_id IN (SELECT company_id FROM safety_company_members WHERE user_id = auth.uid())
    )', t, t);

    -- INSERT: user can insert for themselves
    EXECUTE format('CREATE POLICY "%s_insert" ON %I FOR INSERT WITH CHECK (
      user_id = auth.uid()
    )', t, t);

    -- UPDATE: user can update own records, or managers/owners can update company records
    EXECUTE format('CREATE POLICY "%s_update" ON %I FOR UPDATE USING (
      user_id = auth.uid()
      OR company_id IN (
        SELECT company_id FROM safety_company_members
        WHERE user_id = auth.uid() AND role IN (''owner'', ''manager'', ''ssho'')
      )
    )', t, t);

    -- DELETE: user can delete own, managers can delete company records
    EXECUTE format('CREATE POLICY "%s_delete" ON %I FOR DELETE USING (
      user_id = auth.uid()
      OR company_id IN (
        SELECT company_id FROM safety_company_members
        WHERE user_id = auth.uid() AND role IN (''owner'', ''manager'')
      )
    )', t, t);
  END LOOP;
END $$;
