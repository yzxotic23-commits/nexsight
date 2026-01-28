import { createClient } from '@supabase/supabase-js'

// Client-side Supabase client for MYR/Additional data
const supabaseDataUrl = process.env.NEXT_PUBLIC_SUPABASE_DATA_URL
const supabaseDataAnonKey = process.env.NEXT_PUBLIC_SUPABASE_DATA_ANON_KEY

if (!supabaseDataUrl || !supabaseDataAnonKey) {
  console.warn(
    '⚠️ Missing Supabase Data environment variables. Please check your .env file:\n' +
    '   - NEXT_PUBLIC_SUPABASE_DATA_URL\n' +
    '   - NEXT_PUBLIC_SUPABASE_DATA_ANON_KEY\n'
  )
}

export const supabaseDataClient = createClient(
  supabaseDataUrl || '',
  supabaseDataAnonKey || ''
)
