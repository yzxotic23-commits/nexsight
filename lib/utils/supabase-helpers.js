// Helper functions untuk Supabase operations

/**
 * Fetch all brand market mappings
 */
export async function fetchBrandMarketMappings() {
  try {
    const response = await fetch('/api/settings/brand-market-mapping', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch brand market mappings')
    }

    const result = await response.json()
    return result.data || []
  } catch (error) {
    console.error('Error fetching brand market mappings:', error)
    throw error
  }
}

/**
 * Create new brand market mapping
 */
export async function createBrandMarketMapping({ brand, market, status = 'Active', created_by }) {
  try {
    const response = await fetch('/api/settings/brand-market-mapping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brand,
        market,
        status,
        created_by,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create brand market mapping')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error creating brand market mapping:', error)
    throw error
  }
}

/**
 * Update brand market mapping
 */
export async function updateBrandMarketMapping(id, { brand, market, status, updated_by }) {
  try {
    const response = await fetch(`/api/settings/brand-market-mapping/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brand,
        market,
        status,
        updated_by,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update brand market mapping')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error updating brand market mapping:', error)
    throw error
  }
}

/**
 * Delete brand market mapping
 */
export async function deleteBrandMarketMapping(id) {
  try {
    const response = await fetch(`/api/settings/brand-market-mapping/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete brand market mapping')
    }

    return true
  } catch (error) {
    console.error('Error deleting brand market mapping:', error)
    throw error
  }
}

// ============================================
// User Management Helpers
// ============================================

/**
 * Fetch all users
 */
export async function fetchUsers() {
  try {
    const response = await fetch('/api/settings/user-management', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch users')
    }

    const result = await response.json()
    return result.data || []
  } catch (error) {
    console.error('Error fetching users:', error)
    throw error
  }
}

/**
 * Create new user
 */
export async function createUser({ fullName, email, username, password, role = 'User', status = 'Active', created_by }) {
  try {
    const response = await fetch('/api/settings/user-management', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName,
        email,
        username,
        password,
        role,
        status,
        created_by,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create user')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

/**
 * Update user
 */
export async function updateUser(id, { fullName, email, username, password, role, status, updated_by }) {
  try {
    const response = await fetch(`/api/settings/user-management/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName,
        email,
        username,
        password,
        role,
        status,
        updated_by,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update user')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error updating user:', error)
    throw error
  }
}

/**
 * Delete user
 */
export async function deleteUser(id) {
  try {
    const response = await fetch(`/api/settings/user-management/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete user')
    }

    return true
  } catch (error) {
    console.error('Error deleting user:', error)
    throw error
  }
}

// ============================================
// Activity Log Helpers
// ============================================

/**
 * Fetch all activity logs
 */
export async function fetchActivityLogs(limit = 100, offset = 0) {
  try {
    const response = await fetch(`/api/settings/activity-log?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch activity logs')
    }

    const result = await response.json()
    return result.data || []
  } catch (error) {
    console.error('Error fetching activity logs:', error)
    throw error
  }
}

/**
 * Create activity log entry
 */
export async function createActivityLog({ user_name, user_id, action, target, ip_address, user_agent, details }) {
  try {
    const response = await fetch('/api/settings/activity-log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_name,
        user_id,
        action,
        target,
        ip_address,
        user_agent,
        details,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create activity log')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error creating activity log:', error)
    // Don't throw error for activity log - it's not critical if logging fails
    return null
  }
}