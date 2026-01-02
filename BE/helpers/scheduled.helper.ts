import Queue from "bull";
import Notification from "../models/notification.model";
import JobView from "../models/job-view.model";

// Redis connection URL
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Scheduled jobs queue
const scheduledQueue = new Queue("scheduled-jobs", REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 10
  }
});

/**
 * Job: Clean up old read notifications
 * Runs daily - keeps last 30 days of notifications
 */
scheduledQueue.process("cleanup-old-notifications", async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const deleted = await Notification.deleteMany({
    isRead: true,
    createdAt: { $lt: thirtyDaysAgo }
  });

  console.log(`[Scheduled] Cleaned up ${deleted.deletedCount} old notifications`);
  return { deleted: deleted.deletedCount };
});

/**
 * Job: Aggregate job view statistics 
 * Runs daily - compresses individual views into daily summaries
 */
scheduledQueue.process("aggregate-job-views", async () => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Delete individual views older than 7 days (we keep aggregated counts in Job.viewCount)
  const deleted = await JobView.deleteMany({
    createdAt: { $lt: sevenDaysAgo }
  });

  console.log(`[Scheduled] Cleaned up ${deleted.deletedCount} old job views`);
  return { deleted: deleted.deletedCount };
});

// Event handlers
scheduledQueue.on("completed", (job) => {
  console.log(`[Scheduled] Job ${job.name} completed`);
});

scheduledQueue.on("failed", (job, err) => {
  console.error(`[Scheduled] Job ${job?.name} failed:`, err.message);
});

/**
 * Initialize scheduled jobs with cron patterns
 */
export const initScheduledJobs = async () => {
  // Clean up any existing repeatable jobs first
  const existingJobs = await scheduledQueue.getRepeatableJobs();
  for (const job of existingJobs) {
    await scheduledQueue.removeRepeatableByKey(job.key);
  }

  // Schedule cleanup jobs (OTP cleanup removed - handled by MongoDB TTL)
  await scheduledQueue.add("cleanup-old-notifications", {}, {
    repeat: { cron: "0 3 * * *" }, // Every day at 3 AM
    jobId: "cleanup-old-notifications"
  });

  await scheduledQueue.add("aggregate-job-views", {}, {
    repeat: { cron: "0 4 * * *" }, // Every day at 4 AM
    jobId: "aggregate-job-views"
  });

  console.log("[Scheduled] Cron jobs initialized (2 jobs)");
};

export { scheduledQueue };
