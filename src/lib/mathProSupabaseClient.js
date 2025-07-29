// src/lib/mathProSupabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tfxjndooogirubzgonda.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmeGpuZG9vb2dpcnViemdvbmRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1OTk5NzUsImV4cCI6MjA1NzE3NTk3NX0.a9qi7IwgU3YGFgfwMWHnod0gHP1KF6Ar77LZs96Tvmk'

export const mathProSupabase = createClient(supabaseUrl, supabaseAnonKey) 