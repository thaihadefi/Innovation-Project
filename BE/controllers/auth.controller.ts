import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import AccountCandidate from "../models/account-candidate.model";
import AccountCompany from "../models/account-company.model";

export const check = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.token;

    if(!token) {
      res.json({
        code: "error",
        message: "Invalid token."
      });
      return;
    }

    const decoded = jwt.verify(token, `${process.env.JWT_SECRET}`) as jwt.JwtPayload;
    const { id, email } = decoded;

    // Find candidate
    const existAccountCandidate = await AccountCandidate.findOne({
      _id: id,
      email: email
    }).select('fullName email avatar phone studentId cohort major isVerified skills'); // Only needed fields

    if(existAccountCandidate) {
      const infoCandidate = {
        id: existAccountCandidate.id,
        fullName: existAccountCandidate.fullName,
        email: existAccountCandidate.email,
        avatar: existAccountCandidate.avatar,
        phone: existAccountCandidate.phone,
        studentId: existAccountCandidate.studentId,
        cohort: (existAccountCandidate as any).cohort || null,
        major: (existAccountCandidate as any).major || "",
        isVerified: existAccountCandidate.isVerified,
        skills: (existAccountCandidate as any).skills || [],
      };

      res.json({
        code: "success",
        message: "Valid token.",
        infoCandidate: infoCandidate
      });
      return;
    }

    // Find company
    const existAccountCompany = await AccountCompany.findOne({
      _id: id,
      email: email
    }).select('companyName email location address companyModel companyEmployees workingTime workOverTime phone description logo website slug'); // Only needed fields

    if(existAccountCompany) {
      const infoCompany = {
        id: existAccountCompany.id,
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
      };

      res.json({
        code: "success",
        message: "Valid token.",
        infoCompany: infoCompany
      });
      return;
    }

    res.clearCookie("token");
    res.json({
      code: "error",
      message: "Invalid token."
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Invalid token."
    });
  }
}

export const logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie("token");
    res.json({
      code: "success",
      message: "Logged out."
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Invalid request data."
    });
  }
}
