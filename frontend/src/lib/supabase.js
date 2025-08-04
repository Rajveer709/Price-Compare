import { createClient } from '@supabase/supabase-js';

// Fallback values in case environment variables are not set
const DEFAULT_SUPABASE_URL = 'https://isnrkhpeikpyqsrcrkr.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzbnJraHBlaXBreXNxc3Jja2tyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyODk3ODcsImV4cCI6MjA2OTg2NTc4N30.2acM7PQ2Tkn5zX3ibanIvx4V0L1K7Y2NAKYubLm22zc';

// Get values from environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration. Please check your environment variables.');
  console.log('Current configuration:', { supabaseUrl, hasAnonKey: !!supabaseAnonKey });
  
  if (!supabaseUrl.includes('supabase.co')) {
    console.error('Invalid Supabase URL. It should end with .supabase.co');
  }
  
  if (!supabaseAnonKey.startsWith('eyJ')) {
    console.error('Invalid Supabase anon key. It should start with eyJ');
  }
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Add a simple test function
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('products').select('*').limit(1);
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return { success: false, error };
  }
};
