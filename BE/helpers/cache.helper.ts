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
    lazyConnect: true,        // Defer connection until first command (faster startup)
    enableReadyCheck: false,  // Skip ready check for faster initial connection
    retryStrategy: (times) => {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    }
  });
  redis.on("connect", () => console.log("[Cache] Redis connected for distributed caching"));
  redis.on("error", (err) => console.error("[Cache] Redis error:", err.message));
}

const deleteByScanPattern = async (pattern: string): Promise<number> => {
  if (!redis) return 0;

  let cursor = "0";
  let deleted = 0;

  do {
    const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 200);
    cursor = nextCursor;
    if (keys.length > 0) {
      await redis.del(...keys);
      keys.forEach((k) => localCache.del(k));
      deleted += keys.length;
    }
  } while (cursor !== "0");

  return deleted;
};

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  STATIC: 1800,    // 30 minutes - locations, skills, static lists
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
    const local = localCache.get<T>(key);
    if (local !== undefined) return local;

    // Redis fallback hydration (best-effort, non-blocking)
    if (redis) {
      redis.get(key)
        .then((value) => {
          if (!value) return;
          try {
            const parsed = JSON.parse(value);
            localCache.set(key, parsed, CACHE_TTL.DYNAMIC);
          } catch {
            // ignore invalid JSON cache payload
          }
        })
        .catch(() => {});
    }

    return undefined;
  },

  /**
   * Get value and wait for Redis fallback on local miss.
   */
  getAsync: async <T>(key: string): Promise<T | undefined> => {
    const local = localCache.get<T>(key);
    if (local !== undefined) return local;
    if (!redis) return undefined;

    try {
      const value = await redis.get(key);
      if (!value) return undefined;
      const parsed = JSON.parse(value) as T;
      const ttl = await redis.ttl(key);
      localCache.set(key, parsed, ttl > 0 ? ttl : CACHE_TTL.DYNAMIC);
      return parsed;
    } catch {
      return undefined;
    }
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
    if (!redis) return 0;
    return deleteByScanPattern(pattern);
  },

  /**
   * Delete keys by prefix from local cache and Redis.
   * Works even when Redis is not configured.
   */
  delPrefix: async (prefixes: string | string[]): Promise<number> => {
    const prefixList = Array.isArray(prefixes) ? prefixes : [prefixes];
    const localKeys = localCache.keys();
    let deletedCount = 0;

    for (const prefix of prefixList) {
      const localMatched = localKeys.filter((k) => k.startsWith(prefix));
      if (localMatched.length > 0) {
        localCache.del(localMatched);
        deletedCount += localMatched.length;
      }

      if (redis) {
        const pattern = `${prefix}*`;
        deletedCount += await deleteByScanPattern(pattern);
      }
    }

    return deletedCount;
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
        } catch (err) {
          console.warn(`[Cache] Failed to parse cached value for key ${key}`);
        }
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

export const closeCacheConnection = async () => {
  if (!redis) return;
  try {
    await redis.quit();
  } catch {
    redis.disconnect();
  }
};

export default cache;
