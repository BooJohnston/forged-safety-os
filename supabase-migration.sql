-- FORGED Safety Intelligence OS — Supabase Tables
-- Run this in Supabase SQL Editor to create all tables

-- Users table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS safety_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  company TEXT,
  role TEXT DEFAULT 'Safety Manager',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generic safety record tables (all follow same pattern)
-- Each has: id, user_id (FK to auth.users), plus domain fields

CREATE TABLE IF NOT EXISTS safety_hazards (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  category TEXT,
  severity TEXT DEFAULT 'Moderate',
  status TEXT DEFAULT 'Open',
  description TEXT,
  osha_ref TEXT,
  corrective_action TEXT,
  source TEXT,
  project TEXT,
  evidence JSONB DEFAULT '[]',
  created_by TEXT,
  closed_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS safety_daily_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT,
  weather TEXT,
  manpower INTEGER,
  activities TEXT,
  hazards_noted TEXT,
  permits_active TEXT,
  incidents TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS safety_incidents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  severity TEXT,
  type TEXT,
  location TEXT,
  injuries TEXT,
  root_cause TEXT,
  corrective_action TEXT,
  investigation TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS safety_near_misses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT,
  category TEXT,
  severity TEXT,
  location TEXT,
  anonymous BOOLEAN DEFAULT false,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS safety_projects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  location TEXT,
  state TEXT,
  framework TEXT DEFAULT 'OSHA Only',
  status TEXT DEFAULT 'Active',
  scopes TEXT,
  gc TEXT,
  ssho TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS safety_permits (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT,
  location TEXT,
  issued TIMESTAMPTZ,
  expires TIMESTAMPTZ,
  issued_by TEXT,
  competent TEXT,
  status TEXT DEFAULT 'Active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS safety_training (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_name TEXT,
  cert_type TEXT,
  issued TEXT,
  expires TEXT,
  provider TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS safety_workers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  company TEXT,
  trade TEXT,
  oriented BOOLEAN DEFAULT false,
  orientation_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS safety_jhas (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity TEXT,
  location TEXT,
  environment TEXT,
  framework TEXT,
  competent_person TEXT,
  ppe TEXT,
  steps JSONB DEFAULT '[]',
  content TEXT,
  status TEXT DEFAULT 'Draft',
  ai_generated BOOLEAN DEFAULT false,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS safety_sds (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  cas TEXT,
  manufacturer TEXT,
  sds_date TEXT,
  location TEXT,
  ghs_hazard TEXT DEFAULT 'Low',
  ghs_pictograms JSONB DEFAULT '[]',
  ppe TEXT,
  first_aid TEXT,
  spill_response TEXT,
  expired BOOLEAN DEFAULT false,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS safety_lift_plans (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT,
  crane_type TEXT,
  capacity TEXT,
  load_weight NUMERIC,
  rigging_weight NUMERIC DEFAULT 0,
  total_load NUMERIC,
  radius TEXT,
  boom TEXT,
  rated_capacity NUMERIC,
  utilization INTEGER,
  critical BOOLEAN DEFAULT false,
  operator TEXT,
  signal_person TEXT,
  rigger TEXT,
  lift_director TEXT,
  rigging_config TEXT,
  notes TEXT,
  status TEXT DEFAULT 'Pending',
  completed_at TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS safety_audits (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT,
  category TEXT,
  severity TEXT,
  finding TEXT,
  osha_citation TEXT,
  corrective_action TEXT,
  due_date TEXT,
  assigned_to TEXT,
  status TEXT DEFAULT 'Open',
  closed_at TIMESTAMPTZ,
  closed_by TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS safety_orientations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  company TEXT,
  trade TEXT,
  osha10 BOOLEAN DEFAULT false,
  osha30 BOOLEAN DEFAULT false,
  date TEXT,
  emergency_contact TEXT,
  photo_id BOOLEAN DEFAULT false,
  site_training BOOLEAN DEFAULT false,
  badge_issued BOOLEAN DEFAULT false,
  badge_number TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS safety_inspections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT,
  inspector TEXT,
  area TEXT,
  findings TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS safety_documents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  content TEXT,
  analysis TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photo Analysis persistence table
CREATE TABLE IF NOT EXISTS safety_photo_analyses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project TEXT,
  project_id TEXT,
  activity TEXT,
  photo_count INTEGER DEFAULT 0,
  video_frame_count INTEGER DEFAULT 0,
  claude_result TEXT,
  gpt_result TEXT,
  status TEXT DEFAULT 'Completed',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add project_id to tables that need project filtering
-- Run these only if column doesn't exist:
DO $$ BEGIN
  ALTER TABLE safety_hazards ADD COLUMN IF NOT EXISTS project_id TEXT;
  ALTER TABLE safety_daily_logs ADD COLUMN IF NOT EXISTS project_id TEXT;
  ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS project_id TEXT;
  ALTER TABLE safety_near_misses ADD COLUMN IF NOT EXISTS project_id TEXT;
  ALTER TABLE safety_permits ADD COLUMN IF NOT EXISTS project_id TEXT;
  ALTER TABLE safety_inspections ADD COLUMN IF NOT EXISTS project_id TEXT;
  ALTER TABLE safety_jhas ADD COLUMN IF NOT EXISTS project_id TEXT;
  ALTER TABLE safety_lift_plans ADD COLUMN IF NOT EXISTS project_id TEXT;
  ALTER TABLE safety_audits ADD COLUMN IF NOT EXISTS project_id TEXT;
  ALTER TABLE safety_orientations ADD COLUMN IF NOT EXISTS project_id TEXT;
  ALTER TABLE safety_documents ADD COLUMN IF NOT EXISTS project_id TEXT;
  ALTER TABLE safety_projects ADD COLUMN IF NOT EXISTS city TEXT;
  ALTER TABLE safety_projects ADD COLUMN IF NOT EXISTS zip TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Row Level Security: users can only see their own data
ALTER TABLE safety_hazards ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_near_misses ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_jhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_sds ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_lift_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_orientations ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_photo_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies: authenticated users can CRUD their own records
-- Drop existing policies first (safe to run if they don't exist), then create
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
    -- Drop existing policies (ignore if they don't exist)
    BEGIN EXECUTE format('DROP POLICY "%s_select" ON %I', t, t); EXCEPTION WHEN undefined_object THEN NULL; END;
    BEGIN EXECUTE format('DROP POLICY "%s_insert" ON %I', t, t); EXCEPTION WHEN undefined_object THEN NULL; END;
    BEGIN EXECUTE format('DROP POLICY "%s_update" ON %I', t, t); EXCEPTION WHEN undefined_object THEN NULL; END;
    BEGIN EXECUTE format('DROP POLICY "%s_delete" ON %I', t, t); EXCEPTION WHEN undefined_object THEN NULL; END;

    -- Create policies
    EXECUTE format('CREATE POLICY "%s_select" ON %I FOR SELECT USING (auth.uid() = user_id)', t, t);
    EXECUTE format('CREATE POLICY "%s_insert" ON %I FOR INSERT WITH CHECK (auth.uid() = user_id)', t, t);
    EXECUTE format('CREATE POLICY "%s_update" ON %I FOR UPDATE USING (auth.uid() = user_id)', t, t);
    EXECUTE format('CREATE POLICY "%s_delete" ON %I FOR DELETE USING (auth.uid() = user_id)', t, t);
  END LOOP;
END $$;
