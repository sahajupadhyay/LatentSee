-- Migration 002: User Profiles and Enhanced Schema
-- Created: September 30, 2025
-- Description: Creates user profiles table and research data persistence tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user profiles table to extend Supabase auth.users
-- This table stores additional user information not covered by auth.users
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Link to Supabase auth.users table
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- User information
  display_name VARCHAR(100),
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  avatar_url TEXT,
  bio TEXT,
  
  -- User preferences
  preferences JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{
    "email_notifications": true,
    "research_updates": true,
    "performance_alerts": true,
    "weekly_reports": false
  }',
  
  -- User role and permissions
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'researcher', 'admin')),
  permissions JSONB DEFAULT '["read:dashboard", "export:basic"]',
  
  -- Research settings
  research_preferences JSONB DEFAULT '{
    "default_consistency_model": "smart",
    "preferred_metrics": ["latency", "hit_rate"],
    "export_format": "csv",
    "data_retention_days": 30
  }',
  
  -- Account metadata
  last_seen_at TIMESTAMP WITH TIME ZONE,
  onboarding_completed BOOLEAN DEFAULT false,
  terms_accepted_at TIMESTAMP WITH TIME ZONE,
  privacy_policy_accepted_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER DEFAULT 1
);

-- Create indexes for user profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_seen ON user_profiles(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at DESC);

-- Create research sessions table for persistence
CREATE TABLE IF NOT EXISTS research_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Session metadata
  session_name VARCHAR(255) NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Research configuration
  consistency_models TEXT[] NOT NULL CHECK (array_length(consistency_models, 1) > 0),
  test_parameters JSONB NOT NULL DEFAULT '{}',
  
  -- Session status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Results summary
  total_requests INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2),
  avg_latency DECIMAL(10,3),
  avg_hit_rate DECIMAL(5,2),
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance metrics table for long-term storage
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Request information
  request_id VARCHAR(50) NOT NULL,
  consistency_model VARCHAR(20) NOT NULL CHECK (consistency_model IN ('neural_authority', 'neural_cache', 'smart_memory')),
  endpoint VARCHAR(100) NOT NULL,
  
  -- Performance data
  latency DECIMAL(10,3) NOT NULL, -- in milliseconds
  cache_status VARCHAR(10) CHECK (cache_status IN ('HIT', 'MISS', 'STALE')),
  response_size INTEGER, -- in bytes
  
  -- Metadata
  user_agent TEXT,
  client_ip INET,
  request_params JSONB,
  response_headers JSONB,
  
  -- Error information
  error_occurred BOOLEAN DEFAULT false,
  error_message TEXT,
  error_code VARCHAR(20),
  
  -- Timing
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Partitioning helper
  date_partition DATE GENERATED ALWAYS AS (recorded_at::date) STORED
);

-- Create indexes for performance metrics
CREATE INDEX IF NOT EXISTS idx_performance_metrics_session_id ON performance_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_consistency_model ON performance_metrics(consistency_model);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_recorded_at ON performance_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_date_partition ON performance_metrics(date_partition);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_cache_status ON performance_metrics(cache_status) WHERE cache_status IS NOT NULL;

-- Create comparison studies table
CREATE TABLE IF NOT EXISTS comparison_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Study information
  study_name VARCHAR(255) NOT NULL,
  description TEXT,
  hypothesis TEXT,
  
  -- Study configuration
  models_compared TEXT[] NOT NULL CHECK (array_length(models_compared, 1) >= 2),
  test_duration_minutes INTEGER DEFAULT 60,
  sample_size INTEGER DEFAULT 1000,
  significance_level DECIMAL(3,2) DEFAULT 0.05,
  
  -- Study results
  results JSONB,
  statistical_analysis JSONB,
  conclusions TEXT,
  
  -- Study status
  status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'running', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user activity log for monitoring
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Activity information
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(100),
  details JSONB,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(100),
  
  -- Timing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Partitioning helper
  date_partition DATE GENERATED ALWAYS AS (created_at::date) STORED
);

-- Create indexes for activity log
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_action ON user_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_date_partition ON user_activity_log(date_partition);

-- Create system settings table for application configuration
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'general',
  is_public BOOLEAN DEFAULT false, -- Whether the setting can be read by non-admin users
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default system settings
INSERT INTO system_settings (key, value, description, category, is_public) VALUES
  ('app.name', '"LatentSee"', 'Application name', 'general', true),
  ('app.version', '"1.0.0"', 'Application version', 'general', true),
  ('research.default_session_duration', '3600', 'Default research session duration in seconds', 'research', false),
  ('research.max_concurrent_sessions', '10', 'Maximum concurrent research sessions per user', 'research', false),
  ('cache.default_ttl', '60', 'Default cache TTL in seconds', 'cache', false),
  ('performance.metrics_retention_days', '90', 'How long to keep performance metrics', 'performance', false),
  ('export.max_records_per_export', '10000', 'Maximum records allowed per data export', 'export', false)
ON CONFLICT (key) DO NOTHING;

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_user_profiles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_research_sessions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_system_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_user_profiles_timestamp_trigger ON user_profiles;
CREATE TRIGGER update_user_profiles_timestamp_trigger
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_timestamp();

DROP TRIGGER IF EXISTS update_research_sessions_timestamp_trigger ON research_sessions;
CREATE TRIGGER update_research_sessions_timestamp_trigger
  BEFORE UPDATE ON research_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_research_sessions_timestamp();

DROP TRIGGER IF EXISTS update_system_settings_timestamp_trigger ON system_settings;
CREATE TRIGGER update_system_settings_timestamp_trigger
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_timestamp();

-- Create function to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (
    user_id,
    display_name,
    first_name,
    last_name,
    avatar_url,
    onboarding_completed,
    terms_accepted_at,
    privacy_policy_accepted_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'avatar_url',
    false,
    CASE WHEN NEW.raw_user_meta_data->>'terms_accepted' = 'true' THEN NOW() ELSE NULL END,
    CASE WHEN NEW.raw_user_meta_data->>'privacy_accepted' = 'true' THEN NOW() ELSE NULL END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Create RLS (Row Level Security) policies for user data protection
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparison_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for research_sessions
CREATE POLICY "Users can manage their own research sessions" ON research_sessions
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for performance_metrics
CREATE POLICY "Users can view their own performance metrics" ON performance_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert performance metrics" ON performance_metrics
  FOR INSERT WITH CHECK (true); -- Allow API to insert metrics

-- RLS Policies for comparison_studies
CREATE POLICY "Users can manage their own comparison studies" ON comparison_studies
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for user_activity_log
CREATE POLICY "Users can view their own activity log" ON user_activity_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can log user activity" ON user_activity_log
  FOR INSERT WITH CHECK (true); -- Allow API to log activity

-- RLS Policies for system_settings
CREATE POLICY "Public settings can be read by authenticated users" ON system_settings
  FOR SELECT USING (auth.role() = 'authenticated' AND is_public = true);

CREATE POLICY "Admins can manage all system settings" ON system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create views for easier data access
CREATE OR REPLACE VIEW user_profile_summary AS
SELECT 
  up.id,
  up.user_id,
  up.display_name,
  up.first_name,
  up.last_name,
  up.avatar_url,
  up.role,
  up.onboarding_completed,
  up.last_seen_at,
  up.created_at,
  au.email,
  au.email_confirmed_at,
  au.last_sign_in_at
FROM user_profiles up
JOIN auth.users au ON up.user_id = au.id;

CREATE OR REPLACE VIEW research_session_summary AS
SELECT 
  rs.id,
  rs.user_id,
  rs.session_name,
  rs.status,
  rs.consistency_models,
  rs.total_requests,
  rs.success_rate,
  rs.avg_latency,
  rs.avg_hit_rate,
  rs.started_at,
  rs.completed_at,
  up.display_name as user_name
FROM research_sessions rs
JOIN user_profiles up ON rs.user_id = up.user_id;

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON research_sessions TO authenticated;
GRANT SELECT, INSERT ON performance_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON comparison_studies TO authenticated;
GRANT SELECT, INSERT ON user_activity_log TO authenticated;
GRANT SELECT ON system_settings TO authenticated;
GRANT SELECT ON user_profile_summary TO authenticated;
GRANT SELECT ON research_session_summary TO authenticated;

-- Create indexes for better performance on large datasets
CREATE INDEX IF NOT EXISTS idx_performance_metrics_latency ON performance_metrics(latency);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_composite ON performance_metrics(user_id, consistency_model, recorded_at);

-- Create partial indexes for active sessions
CREATE INDEX IF NOT EXISTS idx_research_sessions_active ON research_sessions(user_id, status) 
  WHERE status IN ('active', 'running');

-- Comment the tables for documentation
COMMENT ON TABLE user_profiles IS 'Extended user profile information beyond Supabase auth.users';
COMMENT ON TABLE research_sessions IS 'User research sessions for performance analysis';
COMMENT ON TABLE performance_metrics IS 'Detailed performance metrics for API requests';
COMMENT ON TABLE comparison_studies IS 'Comparative analysis studies between consistency models';
COMMENT ON TABLE user_activity_log IS 'Log of all user actions for audit and analytics';
COMMENT ON TABLE system_settings IS 'Application-wide configuration settings';

-- Create a function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Delete performance metrics older than retention period
  DELETE FROM performance_metrics 
  WHERE recorded_at < NOW() - INTERVAL '90 days';
  
  -- Delete activity logs older than 1 year
  DELETE FROM user_activity_log 
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  -- Archive completed research sessions older than 6 months
  UPDATE research_sessions 
  SET status = 'archived' 
  WHERE status = 'completed' 
    AND completed_at < NOW() - INTERVAL '6 months';
    
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (note: this requires pg_cron extension)
-- SELECT cron.schedule('cleanup-old-data', '0 2 * * 0', 'SELECT cleanup_old_data();');

-- Final comment
COMMENT ON SCHEMA public IS 'LatentSee application schema with user profiles and research data persistence';