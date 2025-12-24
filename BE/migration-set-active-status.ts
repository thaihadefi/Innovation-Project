/**
 * Migration: Set existing accounts to "active" status
 * 
 * This migration sets status = "active" for all existing accounts
 * that don't have a status field (old accounts created before this feature)
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function migrate() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(`${process.env.DATABASE}`);
    console.log("Connected!");

    const db = mongoose.connection.db;

    // Update all candidates without status or with null status
    const candidateResult = await db?.collection("accounts-candidate").updateMany(
      { $or: [{ status: { $exists: false } }, { status: null }] },
      { $set: { status: "active" } }
    );
    console.log(`Updated ${candidateResult?.modifiedCount} candidate accounts to active`);

    // Update all companies without status or with null status
    const companyResult = await db?.collection("accounts-company").updateMany(
      { $or: [{ status: { $exists: false } }, { status: null }] },
      { $set: { status: "active" } }
    );
    console.log(`Updated ${companyResult?.modifiedCount} company accounts to active`);

    console.log("Migration completed!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
