import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const createSupabaseClient = () => 
  createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        'x-admin-key': 'your-very-secret-key-123', 
      },
    },
  })

// This prevents multiple instances during Hot Module Replacement (HMR)
const globalForSupabase = global as unknown as { supabase: ReturnType<typeof createSupabaseClient> }

export const supabase = globalForSupabase.supabase || createSupabaseClient()

if (process.env.NODE_ENV !== 'production') globalForSupabase.supabase = supabase