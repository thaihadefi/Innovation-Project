import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import AccountCandidate from "../models/account-candidate.model";
import { RequestAccount } from "../interfaces/request.interface";
import AccountCompany from "../models/account-company.model";

type AccountRole = "candidate" | "company";

const getPayload = (token: string): { id: string; email: string; role?: string } | null => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;
  if (typeof decoded.id !== "string" || typeof decoded.email !== "string") {
    return null;
  }
  return { id: decoded.id, email: decoded.email, role: decoded.role };
};

const verifyByRole = (role: AccountRole, inactiveMessage: string) => {
  return async (req: RequestAccount, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies.token;

      if (!token) {
        res.status(401).json({
          code: "error",
          message: "Please provide token."
        });
        return;
      }

      const payload = getPayload(token);
      if (!payload) {
        res.status(401).json({
          code: "error",
          message: "Invalid token."
        });
        return;
      }

      // Reject immediately if JWT role doesn't match this route's required role (no DB query needed)
      if (payload.role && payload.role !== role) {
        res.status(403).json({ code: "error", message: "Forbidden." });
        return;
      }

      const account = role === "candidate"
        ? await AccountCandidate.findOne({ _id: payload.id, email: payload.email })
        : await AccountCompany.findOne({ _id: payload.id, email: payload.email });

      if (!account) {
        res.status(401).json({
          code: "error",
          message: "Invalid token."
        });
        return;
      }

      if (account.status !== "active") {
        res.status(403).json({
          code: "error",
          message: inactiveMessage
        });
        return;
      }

      req.account = account;
      req.accountType = role;
      next();
    } catch (error) {
      console.log(error);
      res.status(401).json({
        code: "error",
        message: "Invalid token."
      });
    }
  };
};

export const verifyTokenCandidate = verifyByRole(
  "candidate",
  "Account is not active. Please verify your email."
);

export const verifyTokenCompany = verifyByRole(
  "company",
  "Account is pending approval. Please wait for admin verification."
);

// Allow both candidate and company accounts, sets accountType
export const verifyTokenAny = async (
  req: RequestAccount, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const token = req.cookies.token;

    if(!token) {
      // No token - guest user, still proceed
      req.account = null as any;
      req.accountType = "guest";
      next();
      return;
    }

    const payload = getPayload(token);
    if (!payload) {
      req.account = null as any;
      req.accountType = "guest";
      next();
      return;
    }

    // Fast path: role in JWT → query only the right collection (1 query vs 2)
    const checkCandidate = !payload.role || payload.role === "candidate";
    const checkCompany = !payload.role || payload.role === "company";

    if (checkCandidate) {
      const existCandidate = await AccountCandidate.findOne({
        _id: payload.id,
        email: payload.email
      });

      if (existCandidate && existCandidate.status === "active") {
        req.account = existCandidate;
        req.accountType = "candidate";
        next();
        return;
      }
    }

    if (checkCompany) {
      const existCompany = await AccountCompany.findOne({
        _id: payload.id,
        email: payload.email
      });

      if (existCompany && existCompany.status === "active") {
        req.account = existCompany;
        req.accountType = "company";
        next();
        return;
      }
    }

    // Token invalid
    req.account = null as any;
    req.accountType = "guest";
    next();
  } catch (error) {
    // jwt.verify threw (invalid/expired token) — treat as unauthenticated but still proceed
    // Routes using verifyTokenAny allow guests, so we don't return 401 here
    req.account = null as any;
    req.accountType = "guest";
    next();
  }
}
