import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import AccountCandidate from "../models/account-candidate.model";
import AccountCompany from "../models/account-company.model";

export const check = async (req: Request, res: Response) => {
  try {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Vary", "Cookie");

    const token = req.cookies.token;

    if(!token) {
      res.status(401).json({
        code: "error",
        message: "Invalid token."
      });
      return;
    }

    const decoded = jwt.verify(token, `${process.env.JWT_SECRET}`) as jwt.JwtPayload;
    const { id, email, role } = decoded;

    // Fast path: role in JWT → query only the right collection (1 query vs 2)
    // Fallback to sequential queries for legacy tokens without role field
    const checkCandidate = !role || role === "candidate";
    const checkCompany = !role || role === "company";

    if (checkCandidate) {
      const existAccountCandidate = await AccountCandidate.findOne({
        _id: id,
        email: email
      }).select('fullName email avatar phone studentId cohort major isVerified skills status');

      if (existAccountCandidate) {
        if (existAccountCandidate.status !== "active") {
          res.clearCookie("token");
          res.status(401).json({ code: "error", message: "Invalid token." });
          return;
        }

        res.json({
          code: "success",
          message: "Valid token.",
          infoCandidate: {
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
          }
        });
        return;
      }
    }

    if (checkCompany) {
      const existAccountCompany = await AccountCompany.findOne({
        _id: id,
        email: email
      }).select('companyName email location address companyModel companyEmployees workingTime workOverTime phone description logo website slug status');

      if (existAccountCompany) {
        if (existAccountCompany.status !== "active") {
          res.clearCookie("token");
          res.status(401).json({ code: "error", message: "Invalid token." });
          return;
        }

        res.json({
          code: "success",
          message: "Valid token.",
          infoCompany: {
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
          }
        });
        return;
      }
    }

    res.clearCookie("token");
    res.status(401).json({
      code: "error",
      message: "Invalid token."
    });
  } catch (error) {
    res.clearCookie("token");
    res.status(401).json({
      code: "error",
      message: "Invalid token."
    });
  }
}

export const logout = async (req: Request, res: Response) => {
  try {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.clearCookie("token");
    res.json({
      code: "success",
      message: "Logged out."
    });
  } catch (error) {
    res.status(500).json({
      code: "error",
      message: "Failed to logout."
    });
  }
}
