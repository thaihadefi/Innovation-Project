import mongoose from "mongoose";
import Job from "./models/job.model";
import City from "./models/city.model";
import AccountCompany from "./models/account-company.model";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const createIndexes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE || "");
    console.log("✅ Connected to MongoDB");

    console.log("\n📊 Creating indexes...\n");

    // Job indexes
    console.log("1️⃣ Creating Job indexes...");
    
    // Index for slug (unique) - for job detail lookup
    await Job.collection.createIndex({ slug: 1 }, { unique: true });
    console.log("   ✓ job.slug (unique)");
    
    // Index for technologySlugs (array) - for language filter
    await Job.collection.createIndex({ technologySlugs: 1 });
    console.log("   ✓ job.technologySlugs (array)");
    
    // Index for cities (array) - for city filter
    await Job.collection.createIndex({ cities: 1 });
    console.log("   ✓ job.cities (array)");
    
    // Note: Cannot create compound index on two array fields (technologySlugs + cities)
    // MongoDB limitation - will use separate indexes instead
    
    // Index for companyId - for company job listing
    await Job.collection.createIndex({ companyId: 1 });
    console.log("   ✓ job.companyId");

    // City indexes
    console.log("\n2️⃣ Creating City indexes...");
    
    // Index for slug (unique) - for city detail lookup
    await City.collection.createIndex({ slug: 1 }, { unique: true });
    console.log("   ✓ city.slug (unique)");

    // Company indexes
    console.log("\n3️⃣ Creating AccountCompany indexes...");
    
    // Index for slug (unique) - for company detail lookup
    await AccountCompany.collection.createIndex({ slug: 1 }, { unique: true });
    console.log("   ✓ accountCompany.slug (unique)");

    // Text search index for job title and description
    console.log("\n4️⃣ Creating text search index...");
    await Job.collection.createIndex(
      { title: "text", description: "text" },
      { weights: { title: 10, description: 1 } }
    );
    console.log("   ✓ job.title + description (text search)");

    console.log("\n✅ All indexes created successfully!");
    
    // List all indexes
    console.log("\n📋 Verifying indexes:\n");
    const jobIndexes = await Job.collection.indexes();
    console.log("Job indexes:", jobIndexes.length);
    jobIndexes.forEach(idx => {
      console.log(`   - ${JSON.stringify(idx.key)} ${idx.unique ? '(unique)' : ''}`);
    });

  } catch (error) {
    console.error("❌ Index creation failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
};

createIndexes();
