import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '@/lib/logger';

/**
 * User Profile Service
 * 
 * Manages user profiles in the database, extending Supabase auth.users
 * with additional user information and preferences.
 */

export interface UserProfileData {
  id?: string;
  user_id: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  bio?: string;
  preferences?: Record<string, any>;
  notification_settings?: Record<string, any>;
  role?: 'user' | 'researcher' | 'admin';
  permissions?: string[];
  research_preferences?: Record<string, any>;
  onboarding_completed?: boolean;
  terms_accepted_at?: string;
  privacy_policy_accepted_at?: string;
}

export interface UserProfileSummary {
  id: string;
  user_id: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  role: string;
  onboarding_completed: boolean;
  last_seen_at?: string;
  created_at: string;
  email: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
}

export interface ResearchSession {
  id?: string;
  user_id: string;
  session_name: string;
  description?: string;
  tags?: string[];
  consistency_models: string[];
  test_parameters?: Record<string, any>;
  status?: 'active' | 'completed' | 'archived';
  started_at?: string;
  completed_at?: string;
  total_requests?: number;
  success_rate?: number;
  avg_latency?: number;
  avg_hit_rate?: number;
}

export interface PerformanceMetric {
  id?: string;
  session_id?: string;
  user_id: string;
  request_id: string;
  consistency_model: 'neural_authority' | 'neural_cache' | 'smart_memory';
  endpoint: string;
  latency: number;
  cache_status?: 'HIT' | 'MISS' | 'STALE';
  response_size?: number;
  user_agent?: string;
  client_ip?: string;
  request_params?: Record<string, any>;
  response_headers?: Record<string, any>;
  error_occurred?: boolean;
  error_message?: string;
  error_code?: string;
  recorded_at?: string;
}

export class UserProfileService {
  private client: SupabaseClient;

  constructor() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase configuration');
    }

    this.client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }

  /**
   * Get user profile by user ID
   */
  async getUserProfile(userId: string, requestId?: string): Promise<UserProfileSummary | null> {
    const logger = createLogger(requestId || uuidv4());
    
    try {
      const { data, error } = await this.client
        .from('user_profile_summary')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found
          logger.info('No user profile found', { userId });
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to get user profile', error as Error, { userId });
      return null;
    }
  }

  /**
   * Create or update user profile
   */
  async upsertUserProfile(profileData: UserProfileData, requestId?: string): Promise<boolean> {
    const logger = createLogger(requestId || uuidv4());
    
    try {
      const { error } = await this.client
        .from('user_profiles')
        .upsert(profileData, {
          onConflict: 'user_id'
        });

      if (error) {
        throw error;
      }

      logger.info('User profile upserted successfully', { userId: profileData.user_id });
      return true;
    } catch (error) {
      logger.error('Failed to upsert user profile', error as Error, { userId: profileData.user_id });
      return false;
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string, 
    preferences: Record<string, any>,
    requestId?: string
  ): Promise<boolean> {
    const logger = createLogger(requestId || uuidv4());
    
    try {
      const { error } = await this.client
        .from('user_profiles')
        .update({ 
          preferences,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      logger.info('User preferences updated successfully', { userId });
      return true;
    } catch (error) {
      logger.error('Failed to update user preferences', error as Error, { userId });
      return false;
    }
  }

  /**
   * Update last seen timestamp
   */
  async updateLastSeen(userId: string, requestId?: string): Promise<void> {
    const logger = createLogger(requestId || uuidv4());
    
    try {
      const { error } = await this.client
        .from('user_profiles')
        .update({ 
          last_seen_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error && error.code !== 'PGRST116') {
        // Ignore "not found" errors for last seen updates
        throw error;
      }
    } catch (error) {
      // Don't throw errors for last seen updates to avoid disrupting user flow
      logger.warn('Failed to update last seen', { error, userId });
    }
  }

  /**
   * Create research session
   */
  async createResearchSession(sessionData: ResearchSession, requestId?: string): Promise<string | null> {
    const logger = createLogger(requestId || uuidv4());
    
    try {
      const { data, error } = await this.client
        .from('research_sessions')
        .insert({
          ...sessionData,
          started_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      logger.info('Research session created successfully', { 
        sessionId: data.id, 
        userId: sessionData.user_id 
      });
      return data.id;
    } catch (error) {
      logger.error('Failed to create research session', error as Error, { userId: sessionData.user_id });
      return null;
    }
  }

  /**
   * Record performance metric
   */
  async recordPerformanceMetric(metric: PerformanceMetric, requestId?: string): Promise<boolean> {
    const logger = createLogger(requestId || uuidv4());
    
    try {
      const { error } = await this.client
        .from('performance_metrics')
        .insert({
          ...metric,
          recorded_at: metric.recorded_at || new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      // Don't throw errors for metric recording to avoid disrupting API calls
      logger.warn('Failed to record performance metric', { error, requestId: metric.request_id });
      return false;
    }
  }

  /**
   * Get user research sessions
   */
  async getUserResearchSessions(userId: string, limit: number = 10, requestId?: string): Promise<ResearchSession[]> {
    const logger = createLogger(requestId || uuidv4());
    
    try {
      const { data, error } = await this.client
        .from('research_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get user research sessions', error as Error, { userId });
      return [];
    }
  }

  /**
   * Get performance metrics for a session
   */
  async getSessionMetrics(
    sessionId: string, 
    limit: number = 1000,
    requestId?: string
  ): Promise<PerformanceMetric[]> {
    const logger = createLogger(requestId || uuidv4());
    
    try {
      const { data, error } = await this.client
        .from('performance_metrics')
        .select('*')
        .eq('session_id', sessionId)
        .order('recorded_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get session metrics', error as Error, { sessionId });
      return [];
    }
  }

  /**
   * Log user activity
   */
  async logUserActivity(
    userId: string,
    action: string,
    resourceType?: string,
    resourceId?: string,
    details?: Record<string, any>,
    metadata?: {
      ip_address?: string;
      user_agent?: string;
      session_id?: string;
    },
    requestId?: string
  ): Promise<void> {
    const logger = createLogger(requestId || uuidv4());
    
    try {
      const { error } = await this.client
        .from('user_activity_log')
        .insert({
          user_id: userId,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          details,
          ip_address: metadata?.ip_address,
          user_agent: metadata?.user_agent,
          session_id: metadata?.session_id,
          created_at: new Date().toISOString()
        });

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
    } catch (error) {
      // Don't throw errors for activity logging to avoid disrupting user flow
      logger.warn('Failed to log user activity', { error, userId, action });
    }
  }

  /**
   * Get system settings
   */
  async getSystemSettings(keys?: string[], requestId?: string): Promise<Record<string, any>> {
    const logger = createLogger(requestId || uuidv4());
    
    try {
      let query = this.client
        .from('system_settings')
        .select('key, value')
        .eq('is_public', true);

      if (keys && keys.length > 0) {
        query = query.in('key', keys);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const settings: Record<string, any> = {};
      data?.forEach(setting => {
        settings[setting.key] = setting.value;
      });

      return settings;
    } catch (error) {
      logger.error('Failed to get system settings', error as Error);
      return {};
    }
  }

  /**
   * Health check for the profile service
   */
  async healthCheck(requestId?: string): Promise<boolean> {
    const logger = createLogger(requestId || uuidv4());
    
    try {
      const { error } = await this.client
        .from('system_settings')
        .select('key')
        .limit(1);

      return !error;
    } catch (error) {
      logger.error('Profile service health check failed', error as Error);
      return false;
    }
  }
}

// Export singleton instance
export const userProfileService = new UserProfileService();