import NodeCache from "node-cache";

// Create cache instance
// stdTTL: Time to live in seconds (5 minutes for most data)
// checkperiod: Period in seconds to check for expired keys (1 minute)
const cache = new NodeCache({ 
  stdTTL: 300, // 5 minutes default
  checkperiod: 60 
});

export default cache;
