import { Types } from "mongoose";
import Job from "../models/job.model";
import JobView from "../models/job-view.model";

export const recordJobView = async (
  jobId: Types.ObjectId,
  viewerId?: string | null,
  clientIp?: string
): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const fingerprint = clientIp || "unknown";

  try {
    await JobView.create({
      jobId,
      viewerId: viewerId ? new Types.ObjectId(viewerId) : null,
      fingerprint: viewerId ? null : String(fingerprint),
      viewDate: today,
    });

    void Job.updateOne({ _id: jobId }, { $inc: { viewCount: 1 } })
      .exec()
      .catch((err) => console.warn("[Job] Failed to increment viewCount:", err));
  } catch (error: unknown) {
    const err = error as { code?: number };
    if (err?.code !== 11000) {
      console.warn("[Job] Failed to record unique view:", error);
    }
  }
};
