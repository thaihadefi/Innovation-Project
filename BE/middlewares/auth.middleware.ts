import { NextFunction, Response } from "express";
import AccountCandidate from "../models/account-candidate.model";
import AccountCompany from "../models/account-company.model";
import { RequestAccount } from "../interfaces/request.interface";
import { verifyAuthToken, AuthTokenPayload } from "../helpers/jwt.helper";
import { IAccountCandidate } from "../interfaces/models/account-candidate.interface";
import { IAccountCompany } from "../interfaces/models/account-company.interface";

type AccountRole = "candidate" | "company";

const verifyByRole = (role: AccountRole, inactiveMessage: string) => {
  return async (req: RequestAccount, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.cookies.token as string | undefined;

      if (!token) {
        res.status(401).json({
          code: "error",
          message: "Please provide token."
        });
        return;
      }

      const payload = verifyAuthToken<AuthTokenPayload>(token);
      if (!payload) {
        res.status(401).json({
          code: "error",
          message: "Invalid token."
        });
        return;
      }

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

export const verifyTokenAny = async (
  req: RequestAccount, 
  _res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies.token as string | undefined;

    if (!token) {
      req.account = null;
      req.accountType = "guest";
      next();
      return;
    }

    const payload = verifyAuthToken<AuthTokenPayload>(token);
    if (!payload) {
      req.account = null;
      req.accountType = "guest";
      next();
      return;
    }

    const checkCandidate = !payload.role || payload.role === "candidate";
    const checkCompany = !payload.role || payload.role === "company";

    if (checkCandidate) {
      const existCandidate = await AccountCandidate.findOne({
        _id: payload.id,
        email: payload.email
      }).lean<IAccountCandidate>();

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
      }).lean<IAccountCompany>();

      if (existCompany && existCompany.status === "active") {
        req.account = existCompany;
        req.accountType = "company";
        next();
        return;
      }
    }

    req.account = null;
    req.accountType = "guest";
    next();
  } catch {
    req.account = null;
    req.accountType = "guest";
    next();
  }
};
