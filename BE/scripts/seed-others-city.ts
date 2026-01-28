import dotenv from "dotenv";
import mongoose from "mongoose";
import City from "../models/city.model";
import { convertToSlug } from "../helpers/slugify.helper";
import * as databaseConfig from "../config/database.config";

dotenv.config();

const run = async () => {
  if (!process.env.DATABASE) {
    console.error("Missing DATABASE in environment.");
    process.exit(1);
  }

  await databaseConfig.connect();

  const name = "Others";
  const slug = convertToSlug(name);

  const existing = await City.findOne({
    $or: [
      { slug: slug },
      { name: new RegExp(`^${name}$`, "i") }
    ]
  }).lean();

  if (existing) {
    if ((existing as any).slug !== slug) {
      await City.updateOne(
        { _id: (existing as any)._id },
        { $set: { slug: slug, name: name } }
      );
      console.log(`Updated city: ${name} (${slug})`);
    } else {
      console.log(`City already exists: ${name} (${slug})`);
    }
  } else {
    await City.create({ name, slug });
    console.log(`Created city: ${name} (${slug})`);
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Seed failed:", err);
  mongoose.disconnect().finally(() => process.exit(1));
});
