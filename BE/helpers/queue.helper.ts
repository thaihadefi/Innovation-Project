import Queue from "bull";
import nodemailer from "nodemailer";

// Redis connection URL
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Email queue
export const emailQueue = new Queue("email", REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50,      // Keep last 50 failed jobs
    attempts: 3,           // Retry 3 times on failure
    backoff: {
      type: "exponential",
      delay: 5000          // Start with 5 second delay
    }
  }
});

// Email transporter (reuse for all jobs)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

// Process email jobs
emailQueue.process(async (job) => {
  const { to, subject, html } = job.data;
  
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: to,
    subject: subject,
    html: html
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[Queue] Email sent:`, info.response);
  return { messageId: info.messageId };
});

// Queue event handlers
emailQueue.on("completed", (job) => {
  console.log(`[Queue] Job ${job.id} completed - email sent to ${job.data.to}`);
});

emailQueue.on("failed", (job, err) => {
  console.error(`[Queue] Job ${job?.id} failed:`, err.message);
});

emailQueue.on("error", (err) => {
  console.error("[Queue] Redis connection error:", err.message);
});

/**
 * Queue an email to be sent in the background
 * Replaces direct sendMail calls for async processing
 */
export const queueEmail = (to: string, subject: string, html: string) => {
  return emailQueue.add({ to, subject, html });
};

/**
 * Get queue statistics
 */
export const getQueueStats = async () => {
  const [waiting, active, completed, failed] = await Promise.all([
    emailQueue.getWaitingCount(),
    emailQueue.getActiveCount(),
    emailQueue.getCompletedCount(),
    emailQueue.getFailedCount()
  ]);
  return { waiting, active, completed, failed };
};

console.log("[Queue] Bull email queue initialized with Redis");
