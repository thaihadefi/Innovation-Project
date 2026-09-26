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

/**
 * Guards routes that only verified UIT students/alumni may use. Chains after
 * verifyTokenCandidate, adding the isVerified gate that role auth does not cover.
 * `action` is interpolated into the 403 message ("...can post interview experiences.").
 */
export const requireVerifiedCandidate = (action = "access interview experiences") => {
  return (req: RequestAccount, res: Response, next: NextFunction): void => {
    const account = req.account as IAccountCandidate | null | undefined;
    if (!account || req.accountType !== "candidate" || !account.isVerified) {
      res.status(403).json({
        code: "error",
        message: `Only verified UIT students and alumni can ${action}.`,
      });
      return;
    }
    next();
  };
};

const loadActiveLeanAccount = async (
  role: AccountRole,
  payload: AuthTokenPayload
): Promise<IAccountCandidate | IAccountCompany | null> => {
  const query = { _id: payload.id, email: payload.email };
  const account = role === "candidate"
    ? await AccountCandidate.findOne(query).lean<IAccountCandidate>()
    : await AccountCompany.findOne(query).lean<IAccountCompany>();
  return account && account.status === "active" ? account : null;
};

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

    const rolesToTry: AccountRole[] = payload.role
      ? [payload.role].filter((r): r is AccountRole => r === "candidate" || r === "company")
      : ["candidate", "company"];

    for (const role of rolesToTry) {
      const account = await loadActiveLeanAccount(role, payload);
      if (account) {
        req.account = account;
        req.accountType = role;
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
