// Debug script to see what's in saved jobs
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function debug() {
  await mongoose.connect(process.env.DATABASE as string);
  console.log('Connected to MongoDB\n');
  
  // Get saved jobs
  const savedJobs = await mongoose.connection.db?.collection('saved-jobs').find({}).limit(5).toArray();
  console.log('=== SAVED JOBS ===');
  console.log(JSON.stringify(savedJobs, null, 2));
  
  // Get jobs
  const jobs = await mongoose.connection.db?.collection('jobs').find({}).limit(5).toArray();
  console.log('\n=== JOBS ===');
  for (const job of jobs || []) {
    console.log(`Job: ${job.title}, companyId: ${job.companyId}`);
  }
  
  // Get companies
  const companies = await mongoose.connection.db?.collection('accounts-company').find({}).toArray();
  console.log('\n=== COMPANIES ===');
  for (const company of companies || []) {
    console.log(`Company: ${company.companyName}, _id: ${company._id}, logo: ${company.logo ? 'YES' : 'NO'}`);
  }

  process.exit(0);
}

debug().catch(console.error);
