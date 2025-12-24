import mongoose from "mongoose"; 

const schema = new mongoose.Schema(
  {
    companyName: String,
    slug: {
      type: String,
      unique: true
    },
    email: String,
    password: String,
    city: String,
    address: String,
    companyModel: String,
    companyEmployees: String,
    workingTime: String,
    workOverTime: String,
    phone: String,
    description: String,
    logo: String,
    status: {
      type: String,
      enum: ["initial", "active", "inactive"],
      default: "initial"
    }
  },
  {
    timestamps: true, // Automatically creates createdAt and updatedAt fields
  }
);

const AccountCompany = mongoose.model('AccountCompany', schema, "accounts-company");

export default AccountCompany;