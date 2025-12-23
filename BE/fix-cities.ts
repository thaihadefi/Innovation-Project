import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.DATABASE || "");

// Define Job schema (minimal for this migration)
const jobSchema = new mongoose.Schema({
  title: String,
  cities: mongoose.Schema.Types.Mixed, // Can be array or malformed string
});

const Job = mongoose.model('Job', jobSchema, 'jobs');

async function fixMalformedCities() {
  console.log("Connecting to database...");
  
  await mongoose.connection.asPromise();
  console.log("Connected to database!");
  
  // Find all jobs
  const jobs = await Job.find({});
  console.log(`Found ${jobs.length} jobs to check`);
  
  let fixedCount = 0;
  
  for (const job of jobs) {
    const cities = job.cities;
    let needsFix = false;
    let newCities: string[] = [];
    
    // Check if cities is malformed
    if (cities === undefined || cities === null) {
      needsFix = true;
      newCities = [];
    } else if (typeof cities === 'string') {
      // Cities saved as string instead of array - try to parse
      needsFix = true;
      try {
        const parsed = JSON.parse(cities);
        if (Array.isArray(parsed)) {
          // Each element might also be a stringified array
          for (const item of parsed) {
            if (typeof item === 'string') {
              if (item.startsWith('[')) {
                // Nested JSON string
                try {
                  const innerParsed = JSON.parse(item);
                  if (Array.isArray(innerParsed)) {
                    newCities.push(...innerParsed.filter((id: any) => 
                      typeof id === 'string' && /^[a-f\d]{24}$/i.test(id)
                    ));
                  }
                } catch {
                  // Skip invalid
                }
              } else if (/^[a-f\d]{24}$/i.test(item)) {
                // Valid ObjectId
                newCities.push(item);
              }
            }
          }
        }
      } catch {
        newCities = [];
      }
    } else if (Array.isArray(cities)) {
      // Check if array contains valid ObjectIds
      const validIds = cities.filter((id: any) => 
        typeof id === 'string' && /^[a-f\d]{24}$/i.test(id)
      );
      if (validIds.length !== cities.length) {
        needsFix = true;
        newCities = validIds;
      }
    }
    
    if (needsFix) {
      console.log(`Fixing job "${job.title}" (id: ${job._id})`);
      console.log(`  Old cities: ${JSON.stringify(cities)}`);
      console.log(`  New cities: ${JSON.stringify(newCities)}`);
      
      await Job.updateOne(
        { _id: job._id },
        { $set: { cities: newCities } }
      );
      fixedCount++;
    }
  }
  
  console.log(`\nDone! Fixed ${fixedCount} jobs.`);
  process.exit(0);
}

fixMalformedCities().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
