import cache from "./cache.helper";

export const invalidateJobDiscoveryCaches = async () => {
  cache.del(["job_skills", "top_locations", "top_companies", "banned_company_ids"]);
  await cache.delPrefix(["company_list:", "search:"]);
};

export const invalidateExperienceCaches = async (experienceId?: string) => {
  await cache.delPrefix("experiences:list:");
  if (experienceId) {
    cache.del(`experiences:detail:${experienceId}`);
  } else {
    await cache.delPrefix("experiences:detail:");
  }
};

