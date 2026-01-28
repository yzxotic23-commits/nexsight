import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Server-side Supabase client for MYR/Additional data
const supabaseDataUrl = process.env.NEXT_PUBLIC_SUPABASE_DATA_URL
const supabaseDataServiceKey = process.env.SUPABASE_DATA_SERVICE_ROLE_KEY

if (!supabaseDataUrl || !supabaseDataServiceKey) {
  throw new Error(
    'Missing Supabase Data environment variables. Please add to .env:\n' +
    '   - NEXT_PUBLIC_SUPABASE_DATA_URL\n' +
    '   - SUPABASE_DATA_SERVICE_ROLE_KEY\n'
  )
}

// Create Supabase client with service role key (for server-side operations)
export const supabaseDataServer = createClient(
  supabaseDataUrl,
  supabaseDataServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
