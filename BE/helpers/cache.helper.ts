import NodeCache from "node-cache";

// In-memory cache
const localCache = new NodeCache({
  stdTTL: 300, // Default: 5 minutes
  checkperiod: 60
});

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  STATIC: 1800,  // 30 minutes - locations, skills, static lists
  DYNAMIC: 300,  // 5 minutes - jobs, companies, frequently changing
  SHORT: 60,     // 1 minute - very dynamic data like view counts
};

const deleteByScanPattern = (pattern: string): number => {
  const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
  const matched = localCache.keys().filter((k) => regex.test(k));
  if (matched.length > 0) localCache.del(matched);
  return matched.length;
};

const cache = {
  get: <T>(key: string): T | undefined => {
    return localCache.get<T>(key);
  },

  getAsync: async <T>(key: string): Promise<T | undefined> => {
    return localCache.get<T>(key);
  },

  set: (key: string, value: unknown, ttl?: number): boolean => {
    return ttl ? localCache.set(key, value, ttl) : localCache.set(key, value);
  },

  del: (keys: string | string[]): void => {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    localCache.del(keyArray);
  },

  delPattern: async (pattern: string): Promise<number> => {
    return deleteByScanPattern(pattern);
  },

  delPrefix: async (prefixes: string | string[]): Promise<number> => {
    const prefixList = Array.isArray(prefixes) ? prefixes : [prefixes];
    let count = 0;
    for (const prefix of prefixList) {
      count += deleteByScanPattern(`${prefix}*`);
    }
    return count;
  },

  warmUp: async (_keys: string[]): Promise<void> => {},

  getStats: () => ({
    local: localCache.getStats(),
    redisConnected: false
  })
};

export const setCache = (key: string, value: unknown, ttl?: number) => {
  cache.set(key, value, ttl);
};

export const closeCacheConnection = async () => {};

export default cache;
