// Quick migration script to add avatars to test companies
// Run once: node add-avatars.js

const mongoose = require('mongoose');
require('dotenv').config();

const AccountCompany = require('./models/account-company.model').default;

async function addAvatars() {
  await mongoose.connect(process.env.MONGO_URL);
  
  // Add placeholder avatars for test companies
  const updates = [
    { companyName: 'Công việc 5', avatar: 'https://via.placeholder.com/150/FF6B6B/FFFFFF?text=CV5' },
    { companyName: 'hihi', avatar: 'https://via.placeholder.com/150/4ECDC4/FFFFFF?text=HH' },
    { companyName: 'hahahihihi', avatar: 'https://via.placeholder.com/150/FFE66D/000000?text=HA' },
    { companyName: 'hehehehehe', avatar: 'https://via.placeholder.com/150/95E1D3/000000?text=HE' },
  ];

  for (const update of updates) {
    await AccountCompany.updateOne(
      { companyName: update.companyName },
      { $set: { avatar: update.avatar } }
    );
    console.log(`✅ Updated ${update.companyName}`);
  }

  console.log('\\n✅ All test companies now have avatars!');
  process.exit(0);
}

addAvatars().catch(console.error);
