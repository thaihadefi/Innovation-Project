import Queue from "bull";
import ForgotPassword from "../models/forgot-password.model";
import RegisterOtp from "../models/register-otp.model";
import EmailChangeRequest from "../models/emailChangeRequest.model";
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
 * Job: Clean up expired OTPs and password reset requests
 * Runs every hour
 */
scheduledQueue.process("cleanup-expired-otps", async () => {
  const now = new Date();
  
  // Clean expired forgot password records (older than 5 mins)
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const deletedForgotPassword = await ForgotPassword.deleteMany({
    createdAt: { $lt: fiveMinutesAgo }
  });

  // Clean expired register OTPs (older than 10 mins)
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
  const deletedRegisterOtps = await RegisterOtp.deleteMany({
    createdAt: { $lt: tenMinutesAgo }
  });

  // Clean expired email change requests (older than 10 mins)
  const deletedEmailChanges = await EmailChangeRequest.deleteMany({
    createdAt: { $lt: tenMinutesAgo }
  });

  console.log(`[Scheduled] Cleaned up: ${deletedForgotPassword.deletedCount} forgot password, ${deletedRegisterOtps.deletedCount} register OTPs, ${deletedEmailChanges.deletedCount} email changes`);
  
  return { 
    forgotPassword: deletedForgotPassword.deletedCount,
    registerOtps: deletedRegisterOtps.deletedCount,
    emailChanges: deletedEmailChanges.deletedCount
  };
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

  // Schedule cleanup jobs
  await scheduledQueue.add("cleanup-expired-otps", {}, {
    repeat: { cron: "0 * * * *" }, // Every hour at minute 0
    jobId: "cleanup-expired-otps"
  });

  await scheduledQueue.add("cleanup-old-notifications", {}, {
    repeat: { cron: "0 3 * * *" }, // Every day at 3 AM
    jobId: "cleanup-old-notifications"
  });

  await scheduledQueue.add("aggregate-job-views", {}, {
    repeat: { cron: "0 4 * * *" }, // Every day at 4 AM
    jobId: "aggregate-job-views"
  });

  console.log("[Scheduled] All cron jobs initialized");
};

export { scheduledQueue };
