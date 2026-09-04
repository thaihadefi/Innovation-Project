import mongoose, { FilterQuery } from "mongoose";
import AccountCandidate from "../models/account-candidate.model";
import CV from "../models/cv.model";
import Job from "../models/job.model";
import { ICV } from "../interfaces/models/cv.interface";
import { IAccountCandidate } from "../interfaces/models/account-candidate.interface";

export const recountJobApplications = async (
  affectedJobIds: string[],
  options: {
    excludeCandidateId?: string;
    preOps?: (session: mongoose.ClientSession) => Promise<void>;
  } = {}
): Promise<void> => {
  if (affectedJobIds.length === 0) return;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      if (options.preOps) {
        await options.preOps(session);
      }

      const bannedFilter: FilterQuery<IAccountCandidate> = { status: "inactive" };
      if (options.excludeCandidateId) {
        bannedFilter._id = { $ne: new mongoose.Types.ObjectId(options.excludeCandidateId) };
      }

      const allCvs = await CV.find({ jobId: { $in: affectedJobIds.map(id => new mongoose.Types.ObjectId(id)) } })
        .select("email status jobId")
        .session(session)
        .lean<Pick<ICV, "email" | "status" | "jobId">[]>();

      const cvEmails = [...new Set(allCvs.map(cv => cv.email).filter(Boolean))];
      bannedFilter.email = { $in: cvEmails };
      const bannedCandidates = await AccountCandidate.find(bannedFilter)
        .select("email")
        .session(session)
        .lean<Pick<IAccountCandidate, "email">[]>();
      const bannedEmails = new Set(bannedCandidates.map(c => c.email));

      const cvsByJob = new Map<string, Array<Pick<ICV, "email" | "status" | "jobId">>>();
      for (const cv of allCvs) {
        if (!cv.jobId) continue;
        const key = cv.jobId.toString();
        if (!cvsByJob.has(key)) cvsByJob.set(key, []);
        cvsByJob.get(key)!.push(cv);
      }

      const bulkOps = affectedJobIds.map((jobId) => {
        const jobCvs = cvsByJob.get(jobId) ?? [];
        const activeCvs = jobCvs.filter(cv => !bannedEmails.has(cv.email));
        return {
          updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(jobId) },
            update: {
              $set: {
                applicationCount: activeCvs.length,
                approvedCount: activeCvs.filter(cv => cv.status === "approved").length,
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
