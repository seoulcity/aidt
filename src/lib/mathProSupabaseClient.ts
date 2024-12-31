import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xkvmipaqscthcigkafbg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhrdm1pcGFxc2N0aGNpZ2thZmJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIzNDc1NTUsImV4cCI6MjA0NzkyMzU1NX0.0EIuof5tnWQMUHh0OD2o8yplbYuD0FATTm4jed4LXj0';

export const mathProSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
}); 