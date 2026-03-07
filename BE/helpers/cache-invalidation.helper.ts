import cache from "./cache.helper";

/**
 * Invalidate caches that drive job discovery and homepage/company counters.
 * Use this after any mutation that changes job visibility or job counters.
 */
export const invalidateJobDiscoveryCaches = async () => {
  cache.del(["job_skills", "top_locations", "top_companies"]);
  await cache.delPrefix(["company_list:", "search:"]);
};

/**
 * Invalidate experience list cache (all pages/filters) and optionally specific details.
 * Call after any mutation that changes approved experience visibility.
 */
export const invalidateExperienceCaches = async (experienceId?: string) => {
  await cache.delPrefix("experiences:list:");
  if (experienceId) {
    cache.del(`experiences:detail:${experienceId}`);
  } else {
    // Clear ALL detail caches (e.g. when banning a candidate hides all their posts)
    await cache.delPrefix("experiences:detail:");
  }
};

