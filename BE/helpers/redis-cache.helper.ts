import Redis from "ioredis";

// Redis connection 
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) return null;
    return Math.min(times * 200, 2000);
  }
});

redis.on("connect", () => console.log("[Redis Cache] Connected"));
redis.on("error", (err) => console.error("[Redis Cache] Error:", err.message));

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  STATIC: 1800,    // 30 minutes - cities, technologies, static lists
  DYNAMIC: 300,    // 5 minutes - jobs, companies, frequently changing
  SHORT: 60,       // 1 minute - very dynamic data like view counts
};

/**
 * Redis cache wrapper with node-cache compatible API
 * Drop-in replacement for existing cache usage
 */
const cache = {
  /**
   * Get value from cache
   */
  get: async <T>(key: string): Promise<T | undefined> => {
    try {
      const value = await redis.get(key);
      if (value) {
        return JSON.parse(value) as T;
      }
      return undefined;
    } catch (err) {
      console.error("[Redis Cache] Get error:", err);
      return undefined;
    }
  },

  /**
   * Set value in cache with optional TTL
   */
  set: async (key: string, value: unknown, ttl?: number): Promise<boolean> => {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await redis.setex(key, ttl, serialized);
      } else {
        await redis.setex(key, CACHE_TTL.DYNAMIC, serialized);
      }
      return true;
    } catch (err) {
      console.error("[Redis Cache] Set error:", err);
      return false;
    }
  },

  /**
   * Delete key from cache
   */
  del: async (key: string): Promise<boolean> => {
    try {
      await redis.del(key);
      return true;
    } catch (err) {
      console.error("[Redis Cache] Del error:", err);
      return false;
    }
  },

  /**
   * Delete keys matching pattern
   */
  delPattern: async (pattern: string): Promise<number> => {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return keys.length;
    } catch (err) {
      console.error("[Redis Cache] DelPattern error:", err);
      return 0;
    }
  },

  /**
   * Check if key exists
   */
  has: async (key: string): Promise<boolean> => {
    try {
      return (await redis.exists(key)) === 1;
    } catch (err) {
      console.error("[Redis Cache] Has error:", err);
      return false;
    }
  },

  /**
   * Flush all cache
   */
  flushAll: async (): Promise<void> => {
    try {
      await redis.flushdb();
      console.log("[Redis Cache] Flushed all");
    } catch (err) {
      console.error("[Redis Cache] FlushAll error:", err);
    }
  },

  /**
   * Get cache stats
   */
  getStats: async () => {
    try {
      const info = await redis.info("memory");
      const dbSize = await redis.dbsize();
      return { keys: dbSize, info };
    } catch (err) {
      console.error("[Redis Cache] GetStats error:", err);
      return { keys: 0, info: "" };
    }
  }
};

// Helper to set cache with specific TTL (for backwards compatibility)
export const setCache = (key: string, value: unknown, ttl?: number) => {
  cache.set(key, value, ttl);
};

// Export redis client for direct access if needed
export { redis };
export default cache;
