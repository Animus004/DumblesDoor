import { createClient } from '@supabase/supabase-js';

// These should be set as environment variables in your hosting provider (e.g., Vercel, Netlify)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// The app will now show a friendly error screen instead of crashing if these are missing.
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
