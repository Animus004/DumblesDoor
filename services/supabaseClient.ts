

import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
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

// Bootstraps a user_profiles record for every authenticated user
export const bootstrapUserProfile = async (user: User) => {
    if (!supabase) {
        console.error("Supabase client not initialized.");
        return;
    }

    console.log('Bootstrapping profile for', user.id);

    // Check if a profile already exists. .single() will error if no rows are found.
    const { data: existing, error } = await supabase
        .from('user_profiles')
        .select('auth_user_id')
        .eq('auth_user_id', user.id)
        .single();
    
    // If a profile exists (no error), we don't need to do anything.
    if (existing) {
        return;
    }

    // If the error is anything other than "no rows found", log it and stop.
    if (error && error.code !== 'PGRST116') {
        console.error("Error checking for user profile:", error);
        return;
    }

    // At this point, we know no profile exists and there wasn't a database error.
    // Let's create the profile.
    const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
            auth_user_id: user.id,
            email: user.email!, // Assume email is always present for a new user
            name: '',
            city: '',
            phone: null,
            role: 'user',
            verified: false,
        });

    if (insertError) {
        console.error("Error creating profile:", insertError);
    } else {
        console.log('Created profile for', user.id);
    }
};


export { supabase };