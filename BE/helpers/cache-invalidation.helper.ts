import cache from "./cache.helper";

/**
 * Invalidate caches that drive job discovery and homepage/company counters.
 * Use this after any mutation that changes job visibility or job counters.
 */
export const invalidateJobDiscoveryCaches = async () => {
  cache.del(["job_skills", "top_locations", "top_companies"]);
  await cache.delPrefix(["company_list:", "search:"]);
};

