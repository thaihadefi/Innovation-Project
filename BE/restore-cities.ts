import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.DATABASE || "");

// Define Job and City schemas
const jobSchema = new mongoose.Schema({
  title: String,
  cities: mongoose.Schema.Types.Mixed,
});

const citySchema = new mongoose.Schema({
  name: String,
  slug: String,
});

const Job = mongoose.model('Job', jobSchema, 'jobs');
const City = mongoose.model('City', citySchema, 'cities');

async function restoreCities() {
  console.log("Connecting to database...");
  
  await mongoose.connection.asPromise();
  console.log("Connected to database!");
  
  // Get all cities
  const cities = await City.find({});
  console.log(`Found ${cities.length} cities in database:`);
  cities.forEach(c => console.log(`  - ${c.name}: ${c._id}`));
  
  // For jobs with empty cities, set to first 3 cities as default
  const defaultCityIds = cities.slice(0, 3).map(c => c._id.toString());
  console.log(`\nDefault cities to assign: ${defaultCityIds.join(', ')}`);
  
  // Find jobs with empty or invalid cities
  const jobs = await Job.find({ cities: { $in: [[], null, undefined] } });
  console.log(`\nFound ${jobs.length} jobs with empty cities`);
  
  for (const job of jobs) {
    console.log(`Restoring cities for job "${job.title}" (id: ${job._id})`);
    
    await Job.updateOne(
      { _id: job._id },
      { $set: { cities: defaultCityIds } }
    );
  }
  
  console.log(`\nDone! Restored cities for ${jobs.length} jobs.`);
  process.exit(0);
}

restoreCities().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
