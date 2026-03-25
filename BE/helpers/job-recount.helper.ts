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

      // Fetch ALL CVs for affected jobs in one query — eliminates N+1
      const allCvs = await CV.find({ jobId: { $in: affectedJobIds } })
        .select("email status jobId")
        .session(session)
        .lean();

      // Scope banned-candidate lookup to only emails present in these CVs
      // — avoids loading the entire inactive-candidates table into memory
      const cvEmails = [...new Set(allCvs.map((cv: any) => cv.email))];
      bannedFilter.email = { $in: cvEmails };
      const bannedCandidates = await AccountCandidate.find(bannedFilter)
        .select("email")
        .session(session)
        .lean();
      const bannedEmails = new Set(bannedCandidates.map((c: any) => c.email));

      // Group CVs by jobId in JS — no further DB calls needed
      const cvsByJob = new Map<string, any[]>();
      for (const cv of allCvs) {
        if (!cv.jobId) continue;
        const key = cv.jobId.toString();
        if (!cvsByJob.has(key)) cvsByJob.set(key, []);
        cvsByJob.get(key)!.push(cv);
      }

      const bulkOps = affectedJobIds.map((jobId) => {
        const jobCvs = cvsByJob.get(jobId) ?? [];
        const activeCvs = jobCvs.filter((cv: any) => !bannedEmails.has(cv.email));
        return {
          updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(jobId) },
            update: {
              $set: {
                applicationCount: activeCvs.length,
                approvedCount: activeCvs.filter((cv: any) => cv.status === "approved").length,
              },
            },
          },
        };
      });

      if (bulkOps.length > 0) {
        await Job.bulkWrite(bulkOps, { session });
      }
    });
  } finally {
    await session.endSession();
  }
};
