import { useState, useEffect, useRef } from 'react'

// Cache storage - using Map for in-memory cache (faster than localStorage)
const cache = new Map()
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes in milliseconds

/**
 * Custom hook for cached fetch requests
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @param {number} cacheDuration - Cache duration in milliseconds (default: 2 minutes)
 * @returns {object} - { data, loading, error, refetch }
 */
export function useCachedFetch(url, options = {}, cacheDuration = CACHE_DURATION) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const abortControllerRef = useRef(null)

  // Generate cache key from URL and options
  const getCacheKey = () => {
    const optionsStr = JSON.stringify(options)
    return `${url}::${optionsStr}`
  }

  // Check if cache is valid
  const getCachedData = (key) => {
    const cached = cache.get(key)
    if (!cached) return null
    
    const now = Date.now()
    if (now - cached.timestamp > cacheDuration) {
      cache.delete(key) // Remove expired cache
      return null
    }
    
    return cached.data
  }

  // Set cache data
  const setCachedData = (key, data) => {
    cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  // Fetch function
  const fetchData = async (forceRefresh = false) => {
    const cacheKey = getCacheKey()
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = getCachedData(cacheKey)
      if (cached !== null) {
        setData(cached)
        setLoading(false)
        setError(null)
        return
      }
    }

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(url, {
        ...options,
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      // Cache the result
      setCachedData(cacheKey, result)
      
      setData(result)
      setError(null)
    } catch (err) {
      if (err.name === 'AbortError') {
        // Request was cancelled, ignore
        return
      }
      setError(err)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Cleanup: abort request on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [url, JSON.stringify(options)])

  // Refetch function to force refresh
  const refetch = () => fetchData(true)

  return { data, loading, error, refetch }
}

/**
 * Utility function for cached fetch (non-hook version)
 * Useful for one-time fetches or in useEffect
 */
export async function cachedFetch(url, options = {}, cacheDuration = CACHE_DURATION) {
  const cacheKey = `${url}::${JSON.stringify(options)}`
  
  // Check cache
  const cached = cache.get(cacheKey)
  if (cached) {
    const now = Date.now()
    if (now - cached.timestamp <= cacheDuration) {
      return cached.data
    } else {
      cache.delete(cacheKey)
    }
  }

  // Fetch fresh data
  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  const data = await response.json()
  
  // Cache the result
  cache.set(cacheKey, {
    data,
    timestamp: Date.now()
  })
  
  return data
}

/**
 * Clear cache for specific URL pattern or all cache
 */
export function clearCache(urlPattern = null) {
  if (!urlPattern) {
    cache.clear()
    return
  }
  
  // Clear cache entries matching pattern
  for (const key of cache.keys()) {
    if (key.includes(urlPattern)) {
      cache.delete(key)
    }
  }
}
