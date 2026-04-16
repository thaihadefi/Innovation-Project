import AccountCandidate from "../models/account-candidate.model";
import cache, { CACHE_TTL } from "./cache.helper";

const CACHE_KEY = "banned_candidate_ids";

/**
 * Get the set of ObjectId strings for all banned (inactive) candidates.
 * Used to soft-hide content from banned users in public queries.
 * Content is NOT deleted — unban restores visibility automatically.
 * Cached for SHORT TTL (60s) to avoid repeated DB scans on every list request.
 */
export const getBannedCandidateIds = async (): Promise<string[]> => {
  const cached = cache.get<string[]>(CACHE_KEY);
  if (cached) return cached;

  const banned = await AccountCandidate.find({ status: "inactive" })
    .select("_id")
    .lean();
  const ids = banned.map((c: any) => c._id.toString());

  cache.set(CACHE_KEY, ids, CACHE_TTL.SHORT);
  return ids;
};

/** Invalidate banned candidate ID cache — call after any ban/unban action. */
export const invalidateBannedCandidateCache = (): void => {
  cache.del(CACHE_KEY);
};
