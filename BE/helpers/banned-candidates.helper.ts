import AccountCandidate from "../models/account-candidate.model";

/**
 * Get the set of ObjectId strings for all banned (inactive) candidates.
 * Used to soft-hide content from banned users in public queries.
 * Content is NOT deleted — unban restores visibility automatically.
 */
export const getBannedCandidateIds = async (): Promise<string[]> => {
  const banned = await AccountCandidate.find({ status: "inactive" })
    .select("_id")
    .lean();
  return banned.map((c: any) => c._id.toString());
};
