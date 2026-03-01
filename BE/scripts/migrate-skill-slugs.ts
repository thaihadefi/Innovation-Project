/**
 * Migration: Re-normalize all Job skillSlugs and replace raw skills with slugified form.
 *
 * What it does:
 *  1. For every Job document, applies the updated normalizeSkillKey to each element of `skills`.
 *  2. Dedupes the resulting keys.
 *  3. Writes the deduped slugs back to BOTH `skills` and `skillSlugs`.
 *  4. Deletes the `job_skills` Redis cache key so the skills API re-fetches fresh data.
 *
 * Run with:
 *   cd BE && npx ts-node --skip-project scripts/migrate-skill-slugs.ts
 */

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Redis from "ioredis";
import { normalizeSkillKey } from "../helpers/skill.helper";

const DATABASE = process.env.DATABASE;
const REDIS_URL = process.env.REDIS_URL;

if (!DATABASE) {
  console.error("ERROR: DATABASE env var is not set");
  process.exit(1);
}

// Minimal Job schema for migration — only the fields we touch
const jobSchema = new mongoose.Schema(
  { skills: Array, skillSlugs: Array },
  { strict: false, collection: "jobs" }
);
const Job = mongoose.model("Job", jobSchema);

async function migrate() {
  await mongoose.connect(DATABASE!, { bufferCommands: false });
  console.log("Connected to MongoDB");

  const jobs = await Job.find({}, { _id: 1, skills: 1, skillSlugs: 1 }).lean();
  console.log(`Found ${jobs.length} job(s) to process`);

  let updated = 0;
  let skipped = 0;
  const bulkOps: any[] = [];

  for (const job of jobs) {
    // Collect source: prefer skills array, fall back to skillSlugs
    const source: string[] = Array.isArray(job.skills) && job.skills.length > 0
      ? job.skills
      : Array.isArray(job.skillSlugs) ? job.skillSlugs : [];

    // Re-normalize and dedupe
    const seen = new Set<string>();
    const normalized: string[] = [];
    for (const raw of source) {
      const key = normalizeSkillKey(String(raw));
      if (key && !seen.has(key)) {
        seen.add(key);
        normalized.push(key);
      }
    }

    // Always unset `skills` field; update skillSlugs if changed
    const currentSlugs: string[] = Array.isArray(job.skillSlugs) ? job.skillSlugs : [];
    const slugsMatch =
      currentSlugs.length === normalized.length &&
      currentSlugs.every((s, i) => s === normalized[i]);
    const hasSkillsField = job.skills !== undefined;

    if (slugsMatch && !hasSkillsField) {
      skipped++;
      continue;
    }

    bulkOps.push({
      updateOne: {
        filter: { _id: job._id },
        update: { $set: { skillSlugs: normalized }, $unset: { skills: "" } },
      },
    });
    updated++;
  }

  if (bulkOps.length > 0) {
    await Job.bulkWrite(bulkOps, { ordered: false });
    console.log(`Updated ${updated} job(s)`);
  } else {
    console.log("No jobs needed updating");
  }
  console.log(`Skipped ${skipped} job(s) (already normalized)`);

  // Clear job_skills cache from Redis
  if (REDIS_URL) {
    const redis = new Redis(REDIS_URL, { maxRetriesPerRequest: 3, lazyConnect: true });
    try {
      const deleted = await redis.del("job_skills");
      console.log(`Redis: deleted ${deleted} cache key(s) for job_skills`);
    } catch (err) {
      console.warn("Redis cache clear failed (non-fatal):", err);
    } finally {
      await redis.quit().catch(() => redis.disconnect());
    }
  } else {
    console.log("No REDIS_URL configured — restart the server to clear in-memory cache");
  }

  await mongoose.disconnect();
  console.log("Done.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
