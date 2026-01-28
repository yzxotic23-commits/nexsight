import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Server-side Supabase client for MYR/Additional data
let supabaseDataServerInstance = null

// Lazy initialization to avoid build-time errors
function getSupabaseDataServer() {
  if (supabaseDataServerInstance) {
    return supabaseDataServerInstance
  }

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
  supabaseDataServerInstance = createClient(
    supabaseDataUrl,
    supabaseDataServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  return supabaseDataServerInstance
}

// Export as Proxy to ensure lazy initialization (only initializes when accessed at runtime)
export const supabaseDataServer = new Proxy({}, {
  get(target, prop) {
    const client = getSupabaseDataServer()
    const value = client[prop]
    // If it's a function, bind it to the client
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  }
})
