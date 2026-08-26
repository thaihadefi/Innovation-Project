import jwt from "jsonwebtoken";
import AccountCandidate from "../models/account-candidate.model";
import AccountCompany from "../models/account-company.model";
import { IAccountCandidate } from "../interfaces/models/account-candidate.interface";
import { IAccountCompany } from "../interfaces/models/account-company.interface";

export interface CandidateInfoDTO {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
  phone?: string;
  studentId?: string;
  cohort: number | null;
  major: string;
  isVerified: boolean;
  skills: string[];
}

export interface CompanyInfoDTO {
  id: string;
  companyName: string;
  email: string;
  location?: string;
  address?: string;
  companyModel?: string;
  companyEmployees?: string;
  workingTime?: string;
  workOverTime?: string;
  phone?: string;
  description?: string;
  logo?: string;
}

export interface CheckAuthResult {
  valid: boolean;
  accountType?: "candidate" | "company";
  infoCandidate?: CandidateInfoDTO;
  infoCompany?: CompanyInfoDTO;
}

export const checkAuthToken = async (token?: string): Promise<CheckAuthResult> => {
  if (!token) {
    return { valid: false };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;
    const { id, email, role } = decoded;

    const checkCandidate = !role || role === "candidate";
    const checkCompany = !role || role === "company";

    if (checkCandidate) {
      const existAccountCandidate = await AccountCandidate.findOne({
        _id: id,
        email: email
      })
        .select("fullName email avatar phone studentId cohort major isVerified skills status")
        .lean<IAccountCandidate>();

      if (existAccountCandidate) {
        if (existAccountCandidate.status !== "active") {
          return { valid: false };
        }

        return {
          valid: true,
          accountType: "candidate",
          infoCandidate: {
            id: existAccountCandidate._id.toString(),
            fullName: existAccountCandidate.fullName,
            email: existAccountCandidate.email,
            avatar: existAccountCandidate.avatar,
            phone: existAccountCandidate.phone,
            studentId: existAccountCandidate.studentId,
            cohort: existAccountCandidate.cohort ?? null,
            major: existAccountCandidate.major ?? "",
            isVerified: existAccountCandidate.isVerified,
            skills: existAccountCandidate.skills || [],
          }
        };
      }
    }

    if (checkCompany) {
      const existAccountCompany = await AccountCompany.findOne({
        _id: id,
        email: email
      })
        .select("companyName email location address companyModel companyEmployees workingTime workOverTime phone description logo website slug status")
        .lean<IAccountCompany>();

      if (existAccountCompany) {
        if (existAccountCompany.status !== "active") {
          return { valid: false };
        }

        return {
          valid: true,
          accountType: "company",
          infoCompany: {
            id: existAccountCompany._id.toString(),
            companyName: existAccountCompany.companyName,
            email: existAccountCompany.email,
            location: existAccountCompany.location,
            address: existAccountCompany.address,
            companyModel: existAccountCompany.companyModel,
            companyEmployees: existAccountCompany.companyEmployees,
            workingTime: existAccountCompany.workingTime,
            workOverTime: existAccountCompany.workOverTime,
            phone: existAccountCompany.phone,
            description: existAccountCompany.description,
            logo: existAccountCompany.logo,
          }
        };
      }
    }

    return { valid: false };
  } catch {
    return { valid: false };
  }
};
