import mongoose from "mongoose";
import AccountCandidate from "../models/account-candidate.model";
import CV from "../models/cv.model";
import Job from "../models/job.model";

/**
 * Atomically recount applicationCount/approvedCount for affected jobs.
 * Uses a MongoDB transaction so that the banned-emails snapshot and the
 * job count writes are consistent — even when two candidates are banned
 * (or deleted) at the same time.
 *
 * @param affectedJobIds  Job IDs whose counts need recalculating
 * @param options.excludeCandidateId  Candidate _id to exclude from the
 *                                    "active" list (used during deletion)
 * @param options.preOps  Optional async operations to run inside the
 *                        transaction before recounting (e.g. status change)
 */
export const recountJobApplications = async (
  affectedJobIds: string[],
  options: {
    excludeCandidateId?: string;
    preOps?: (session: mongoose.ClientSession) => Promise<void>;
  } = {}
) => {
  if (affectedJobIds.length === 0) return;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Run any pre-operations (e.g. status change) inside the transaction
      if (options.preOps) {
        await options.preOps(session);
      }

      // Build the filter for banned candidates
      const bannedFilter: any = { status: "inactive" };
      if (options.excludeCandidateId) {
        bannedFilter._id = { $ne: options.excludeCandidateId };
      }

      // Snapshot banned emails inside the transaction → serialised read
      const bannedCandidates = await AccountCandidate.find(bannedFilter)
        .select("email")
        .session(session)
        .lean();
      const bannedEmails = new Set(bannedCandidates.map((c: any) => c.email));

      // Recount each affected job from actual CV data
      const bulkOps = await Promise.all(
        affectedJobIds.map(async (jobId) => {
          const jobCvs = await CV.find({ jobId })
            .select("email status")
            .session(session)
            .lean();
          const activeCvs = jobCvs.filter(
            (cv: any) => !bannedEmails.has(cv.email)
          );
          return {
            updateOne: {
              filter: { _id: new mongoose.Types.ObjectId(jobId) },
              update: {
                $set: {
                  applicationCount: activeCvs.length,
                  approvedCount: activeCvs.filter(
                    (cv: any) => cv.status === "approved"
                  ).length,
                },
              },
            },
          };
        })
      );

      if (bulkOps.length > 0) {
        await Job.bulkWrite(bulkOps, { session });
      }
    });
  } finally {
    await session.endSession();
  }
};
