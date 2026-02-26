import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client
// Untuk API routes dan server components
// Create fresh client on each request to avoid caching issues

function getSupabaseServer() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase environment variables. Please add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your .env file'
    )
  }

  // Server-side client dengan service role key (bypass RLS jika diperlukan)
  // No caching - create fresh client each time to ensure latest data
  const client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'cache-control': 'no-cache, no-store, must-revalidate',
        'pragma': 'no-cache',
        'expires': '0'
      },
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          cache: 'no-store',
          next: { revalidate: 0 }
        })
      }
    }
  })

  return client
}

// Export as Proxy to create fresh client on each access (no singleton caching)
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
