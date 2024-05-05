import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID
const SUPABASE_API_KEY = process.env.SUPABASE_API_KEY

export const supabase = createClient(`https://${SUPABASE_PROJECT_ID}.supabase.co`, `${SUPABASE_API_KEY}`)