// Migration script to add logos to ALL companies
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function addLogos() {
  await mongoose.connect(process.env.DATABASE as string);
  console.log('Connected to MongoDB');
  
  // Get ALL companies - correct collection name: accounts-company
  const companies = await mongoose.connection.db?.collection('accounts-company').find({}).toArray();
  
  console.log(`Found ${companies?.length} total companies`);
  
  // Add logos to companies that don't have one
  for (const company of companies || []) {
    if (company.logo) {
      console.log(`⏭️ Skipping ${company.companyName} (already has logo)`);
      continue;
    }
    
    const name = company.companyName || 'Company';
    const logo = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0088FF&color=fff&size=128`;
    
    await mongoose.connection.db?.collection('accounts-company').updateOne(
      { _id: company._id },
      { $set: { logo: logo } }
    );
    console.log(`✅ Added logo for: ${name}`);
  }

  console.log('\n✅ Migration complete! All companies now have logos.');
  process.exit(0);
}

addLogos().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
