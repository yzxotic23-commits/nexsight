import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Server-side Supabase client for MYR/Additional data
// Create fresh client on each request to avoid caching issues

function getSupabaseDataServer() {
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
  // No caching - create fresh client each time to ensure latest data
  const client = createClient(
    supabaseDataUrl,
    supabaseDataServiceKey,
    {
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
    }
  )

  return client
}

// Export as Proxy to create fresh client on each access (no singleton caching)
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
