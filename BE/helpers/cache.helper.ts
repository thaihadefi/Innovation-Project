import NodeCache from "node-cache";

// Best Practice: Different cache TTLs for different data types
const cache = new NodeCache({ 
  stdTTL: 300, // Default: 5 minutes for dynamic data
  checkperiod: 60 
});

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  STATIC: 1800,    // 30 minutes - cities, technologies, static lists
  DYNAMIC: 300,    // 5 minutes - jobs, companies, frequently changing
  SHORT: 60,       // 1 minute - very dynamic data like view counts
};

// Helper to set cache with specific TTL
export const setCache = (key: string, value: unknown, ttl?: number) => {
  if (ttl) {
    cache.set(key, value, ttl);
  } else {
    cache.set(key, value);
  }
};

export default cache;
