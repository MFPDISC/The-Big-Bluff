import { query } from '../db/connection.js';

/**
 * Database-backed cache system to reduce API rate limits
 * Stores API responses in PostgreSQL with configurable TTL
 */

// Get data from cache
export async function getCache(key) {
  try {
    const result = await query(
      `SELECT data, expires_at 
       FROM data_cache 
       WHERE cache_key = $1 AND expires_at > NOW()`,
      [key]
    );

    if (result.rows.length > 0) {
      return result.rows[0].data;
    }
    return null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

// Set data in cache with TTL (in minutes)
export async function setCache(key, data, ttlMinutes = 60) {
  try {
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    
    await query(
      `INSERT INTO data_cache (cache_key, data, expires_at, last_refreshed)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (cache_key) 
       DO UPDATE SET 
         data = EXCLUDED.data,
         expires_at = EXCLUDED.expires_at,
         last_refreshed = NOW()`,
      [key, JSON.stringify(data), expiresAt]
    );
    
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
}

// Delete cache entry
export async function deleteCache(key) {
  try {
    await query(
      `DELETE FROM data_cache WHERE cache_key = $1`,
      [key]
    );
    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
}

// Clear expired cache entries
export async function clearExpiredCache() {
  try {
    const result = await query(
      `DELETE FROM data_cache WHERE expires_at < NOW()`
    );
    return result.rowCount;
  } catch (error) {
    console.error('Cache clear error:', error);
    return 0;
  }
}

// Get cache metadata (for debugging)
export async function getCacheInfo(key) {
  try {
    const result = await query(
      `SELECT cache_key, created_at, expires_at, last_refreshed,
              EXTRACT(EPOCH FROM (expires_at - NOW())) as seconds_until_expiry
       FROM data_cache 
       WHERE cache_key = $1`,
      [key]
    );

    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  } catch (error) {
    console.error('Cache info error:', error);
    return null;
  }
}

// Invalidate all cache for a specific pattern
export async function invalidateCachePattern(pattern) {
  try {
    const result = await query(
      `DELETE FROM data_cache WHERE cache_key LIKE $1`,
      [`%${pattern}%`]
    );
    return result.rowCount;
  } catch (error) {
    console.error('Cache invalidate error:', error);
    return 0;
  }
}

// Helper to generate cache keys
export function generateCacheKey(prefix, params = {}) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  
  return sortedParams ? `${prefix}:${sortedParams}` : prefix;
}

export default {
  getCache,
  setCache,
  deleteCache,
  clearExpiredCache,
  getCacheInfo,
  invalidateCachePattern,
  generateCacheKey
};
