import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Check for missing values (useful during development)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables!");
  console.error("REACT_APP_SUPABASE_URL:", supabaseUrl);
  console.error("REACT_APP_SUPABASE_ANON_KEY:", supabaseAnonKey);
}

// Create a single Supabase client for the entire app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
