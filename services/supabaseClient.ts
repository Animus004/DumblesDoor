import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';

// These should be set as environment variables in your hosting provider (e.g., Vercel, Netlify)
// They MUST be prefixed with VITE_ to be exposed to the client-side code.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient<Database> | null = null;

// Only initialize the client if the environment variables are present.
// Otherwise, the app's main component will detect the missing keys and show a prompt.
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
} else {
  console.warn("Supabase environment variables are not set. Please check your .env file or hosting provider settings.");
}

export { supabase };
