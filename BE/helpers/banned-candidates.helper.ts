import AccountCandidate from "../models/account-candidate.model";
import cache, { CACHE_TTL } from "./cache.helper";
import { IAccountCandidate } from "../interfaces/models/account-candidate.interface";

const CACHE_KEY = "banned_candidate_ids";

export const getBannedCandidateIds = async (): Promise<string[]> => {
  const cached = cache.get<string[]>(CACHE_KEY);
  if (cached) return cached;

  const banned = await AccountCandidate.find({ status: "inactive" })
    .select("_id")
    .lean<Pick<IAccountCandidate, "_id">[]>();
  const ids = banned.map((c) => c._id.toString());

  cache.set(CACHE_KEY, ids, CACHE_TTL.SHORT);
  return ids;
};

export const invalidateBannedCandidateCache = (): void => {
  cache.del(CACHE_KEY);
};
