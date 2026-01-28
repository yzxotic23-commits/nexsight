import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client
// Untuk API routes dan server components

let supabaseServerInstance = null

// Lazy initialization to avoid build-time errors
function getSupabaseServer() {
  if (supabaseServerInstance) {
    return supabaseServerInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase environment variables. Please add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your .env file'
    )
  }

  // Server-side client dengan service role key (bypass RLS jika diperlukan)
  supabaseServerInstance = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return supabaseServerInstance
}

// Export as Proxy to ensure lazy initialization (only initializes when accessed at runtime)
export const supabaseServer = new Proxy({}, {
  get(target, prop) {
    const client = getSupabaseServer()
    const value = client[prop]
    // If it's a function, bind it to the client
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  }
})
