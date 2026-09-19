-- Create Projects Table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Logs Table
CREATE TABLE logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  status_code INTEGER,
  response_time INTEGER,
  ip_address TEXT,
  payload JSONB,
  user_identifier TEXT,
  payload_size_bytes INTEGER DEFAULT 0,
  risk_score INTEGER DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create Alerts Table
CREATE TABLE alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  log_id UUID REFERENCES logs(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'OPEN',
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create User Baselines Table (UEBA)
CREATE TABLE user_baselines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_identifier TEXT NOT NULL,
  typical_start_hour INTEGER DEFAULT 9,
  typical_end_hour INTEGER DEFAULT 18,
  frequent_endpoints TEXT[] DEFAULT ARRAY[]::TEXT[],
  max_expected_bytes INTEGER DEFAULT 102400,
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (project_id, user_identifier)
);

-- Set up Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_baselines ENABLE ROW LEVEL SECURITY;

-- Policies for Projects (Users can only see and manage their own projects)
CREATE POLICY "Users can view own projects" 
  ON projects FOR SELECT 
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own projects" 
  ON projects FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own projects" 
  ON projects FOR UPDATE 
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own projects" 
  ON projects FOR DELETE 
  USING (auth.uid() = owner_id);

-- Policies for Logs (Users can only view logs for their projects)
CREATE POLICY "Users can view logs of own projects" 
  ON logs FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = logs.project_id AND projects.owner_id = auth.uid()
  ));

-- Allow service role (Edge functions) to insert logs
CREATE POLICY "Service role can insert logs" 
  ON logs FOR INSERT 
  WITH CHECK (true);

-- Policies for Alerts (Users can only view and update alerts for their projects)
CREATE POLICY "Users can view alerts of own projects" 
  ON alerts FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = alerts.project_id AND projects.owner_id = auth.uid()
  ));

CREATE POLICY "Users can update alerts of own projects" 
  ON alerts FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = alerts.project_id AND projects.owner_id = auth.uid()
  ));

-- Enable Realtime for logs and alerts
ALTER PUBLICATION supabase_realtime ADD TABLE logs;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE user_baselines;

-- Policies for User Baselines
CREATE POLICY "Users can view baselines of own projects" 
  ON user_baselines FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = user_baselines.project_id AND projects.owner_id = auth.uid()
  ));

CREATE POLICY "Users can update baselines of own projects" 
  ON user_baselines FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = user_baselines.project_id AND projects.owner_id = auth.uid()
  ));

-- Allow service role to read/update user_baselines for the edge function
CREATE POLICY "Service role can read and update user_baselines" 
  ON user_baselines FOR ALL
  USING (true);

-- Seed Script for testing UEBA
-- Only executes if a project exists. Adds baselines for 'dev_alice' and 'intern_bob'
INSERT INTO user_baselines (project_id, user_identifier, typical_start_hour, typical_end_hour, frequent_endpoints, max_expected_bytes)
SELECT id, 'dev_alice', 9, 18, ARRAY['/api/v1/feed', '/api/v1/profile', '/api/v1/settings'], 51200
FROM projects
LIMIT 1
ON CONFLICT (project_id, user_identifier) DO NOTHING;

INSERT INTO user_baselines (project_id, user_identifier, typical_start_hour, typical_end_hour, frequent_endpoints, max_expected_bytes)
SELECT id, 'intern_bob', 10, 16, ARRAY['/api/v1/dashboard'], 10240
FROM projects
LIMIT 1
ON CONFLICT (project_id, user_identifier) DO NOTHING;
