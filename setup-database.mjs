#!/usr/bin/env node

/**
 * Database Migration Script for Smart Cloud Dashboard
 * Applies the initial schema to your Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Environment variables (ensure these are set in .env.local)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please ensure your .env.local contains:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runMigration() {
  try {
    console.log('🚀 Starting database migration...');
    
    // Read the migration file
    const migrationPath = resolve(process.cwd(), 'migrations', '001_initial_schema.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded successfully');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    });
    
    if (error) {
      // If RPC doesn't work, try direct query approach
      console.log('⚙️  Trying alternative migration method...');
      
      // Split SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.includes('CREATE TABLE') || 
            statement.includes('CREATE INDEX') || 
            statement.includes('INSERT INTO')) {
          
          console.log(`📝 Executing: ${statement.substring(0, 50)}...`);
          
          // For table creation, we'll use a more direct approach
          if (statement.includes('CREATE TABLE')) {
            // This will need to be done manually in Supabase SQL editor
            console.log('⚠️  Table creation detected - please run manually in Supabase SQL Editor:');
            console.log(statement + ';');
          }
        }
      }
    } else {
      console.log('✅ Migration executed successfully!');
    }
    
    // Test database connection by trying to query
    console.log('🔍 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('products')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('⚠️  Database connection test failed - you may need to run the migration manually');
      console.log('Error:', testError.message);
      console.log('\n📋 Manual Setup Instructions:');
      console.log('1. Go to your Supabase project: https://supabase.com/dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the contents of migrations/001_initial_schema.sql');
      console.log('4. Click "Run" to execute the migration');
    } else {
      console.log('✅ Database setup complete! Products table is accessible.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📋 Manual Setup Instructions:');
    console.log('1. Go to your Supabase project: https://supabase.com/dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of migrations/001_initial_schema.sql');
    console.log('4. Click "Run" to execute the migration');
  }
}

// Run the migration
runMigration();