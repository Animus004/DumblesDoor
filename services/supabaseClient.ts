
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

export const bootstrapUserProfile = async (user: User): Promise<boolean> => {
    if (!supabase) {
        console.error("Supabase client not initialized.");
        return false;
    }
    
    const { data, error } = await supabase
        .from('user_profiles')
        .select('auth_user_id')
        .eq('auth_user_id', user.id)
        .single();

    if (error && error.code !== 'PGRST116') { // 'PGRST116' means no rows found, which is expected
        console.error("Error checking for user profile:", error);
        return false;
    }
    
    if (data) {
        console.log("Profile already exists for user:", user.id);
        return true;
    }
    
    console.log(`No profile found for user ${user.id}. Creating a new one.`);
    const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
            auth_user_id: user.id,
            email: user.email!,
            name: '', // Will be filled in during onboarding
            city: '', // Will be filled in during onboarding
            phone: null,
            role: 'user',
            verified: false,
        });

    if (insertError) {
        console.error("Error creating profile:", insertError);
        return false;
    }
    
    console.log("New profile created successfully for user:", user.id);
    return true;
};


export { supabase };