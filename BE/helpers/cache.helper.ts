import NodeCache from "node-cache";
import Redis from "ioredis";

// Local in-memory cache for fast sync access
const localCache = new NodeCache({ 
  stdTTL: 300, // Default: 5 minutes for dynamic data
  checkperiod: 60 
});

// Redis for distributed/persistent cache
const REDIS_URL = process.env.REDIS_URL;
let redis: Redis | null = null;

if (REDIS_URL) {
  redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    }
  });
  redis.on("connect", () => console.log("[Cache] Redis connected for distributed caching"));
  redis.on("error", (err) => console.error("[Cache] Redis error:", err.message));
}

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  STATIC: 1800,    // 30 minutes - cities, technologies, static lists
  DYNAMIC: 300,    // 5 minutes - jobs, companies, frequently changing
  SHORT: 60,       // 1 minute - very dynamic data like view counts
};

/**
 * Hybrid cache wrapper
 * - Sync get/set using local NodeCache (fast, same process)
 * - Async sync to Redis for persistence (background)
 */
const cache = {
  /**
   * Get value from local cache (sync)
   */
  get: <T>(key: string): T | undefined => {
    return localCache.get<T>(key);
  },

  /**
   * Set value in local cache and sync to Redis (background)
   */
  set: (key: string, value: unknown, ttl?: number): boolean => {
    // Set in local cache immediately
    if (ttl) {
      localCache.set(key, value, ttl);
    } else {
      localCache.set(key, value);
    }
    
    // Sync to Redis in background (non-blocking)
    if (redis) {
      const serialized = JSON.stringify(value);
      const redisTtl = ttl || CACHE_TTL.DYNAMIC;
      redis.setex(key, redisTtl, serialized).catch(() => {});
    }
    
    return true;
  },

  /**
   * Delete from both local and Redis cache
   */
  del: (keys: string | string[]): void => {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    keyArray.forEach(key => {
      localCache.del(key);
      if (redis) {
        redis.del(key).catch(() => {});
      }
    });
  },

  /**
   * Delete keys matching pattern (Redis only)
   */
  delPattern: async (pattern: string): Promise<number> => {
    if (redis) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        // Also delete from local
        keys.forEach(k => localCache.del(k));
      }
      return keys.length;
    }
    return 0;
  },

  /**
   * Warm up local cache from Redis (call on server start)
   */
  warmUp: async (keys: string[]): Promise<void> => {
    if (!redis) return;
    
    for (const key of keys) {
      const value = await redis.get(key);
      if (value) {
        try {
          const ttl = await redis.ttl(key);
          localCache.set(key, JSON.parse(value), ttl > 0 ? ttl : CACHE_TTL.DYNAMIC);
        } catch {}
      }
    }
    console.log(`[Cache] Warmed up ${keys.length} keys from Redis`);
  },

  /**
   * Get cache stats
   */
  getStats: () => {
    return {
      local: localCache.getStats(),
      redisConnected: redis?.status === "ready"
    };
  }
};

// Helper to set cache with specific TTL (backwards compatibility)
export const setCache = (key: string, value: unknown, ttl?: number) => {
  cache.set(key, value, ttl);
};

export default cache;
