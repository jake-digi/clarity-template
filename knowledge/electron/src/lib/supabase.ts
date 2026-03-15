import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false // Disable this for Electron to prevent hanging on URL parsing
    }
});

console.log('🔌 Supabase client initialized with URL:', supabaseUrl);

// Test connectivity immediately
fetch(`${supabaseUrl}/rest/v1/`, {
    method: 'HEAD',
    headers: { 'apikey': supabaseAnonKey }
})
    .then(response => console.log('✅ Supabase Connection Test:', response.status === 200 ? 'OK' : response.status))
    .catch(err => console.error('❌ Supabase Connection Test FAILED:', err));
