import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import AccountCandidate from "../models/account-candidate.model";
import { RequestAccount } from "../interfaces/request.interface";
import AccountCompany from "../models/account-company.model";

export const verifyTokenCandidate = async (
  req: RequestAccount, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const token = req.cookies.token;

    if(!token) {
      res.json({
        code: "error",
        message: "Please provide token!"
      })
      return;
    }

    const decoded = jwt.verify(token, `${process.env.JWT_SECRET}`) as jwt.JwtPayload;
    const { id, email } = decoded;

    // Find candidate
    const existAccountCandidate = await AccountCandidate.findOne({
      _id: id,
      email: email
    })

    if(!existAccountCandidate) {
      res.json({
        code: "error",
        message: "Invalid token!"
      });
      return;
    }

    // Check if account is active
    if(existAccountCandidate.status !== "active") {
      res.json({
        code: "error",
        message: "Account is not active. Please verify your email."
      });
      return;
    }

    req.account = existAccountCandidate;

    next();
  } catch (error) {
    console.log(error);
    res.json({
      code: "error",
      message: "Invalid token!"
    })
  }
}

export const verifyTokenCompany = async (
  req: RequestAccount, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const token = req.cookies.token;

    if(!token) {
      res.json({
        code: "error",
        message: "Please provide token!"
      })
      return;
    }

    const decoded = jwt.verify(token, `${process.env.JWT_SECRET}`) as jwt.JwtPayload;
    const { id, email } = decoded;

    // Find company
    const existAccountCompany = await AccountCompany.findOne({
      _id: id,
      email: email
    })

    if(!existAccountCompany) {
      res.json({
        code: "error",
        message: "Invalid token!"
      });
      return;
    }

    // Check if account is active
    if(existAccountCompany.status !== "active") {
      res.json({
        code: "error",
        message: "Account is pending approval. Please wait for admin verification."
      });
      return;
    }

    req.account = existAccountCompany;

    next();
  } catch (error) {
    console.log(error);
    res.json({
      code: "error",
      message: "Invalid token!"
    })
  }
}

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

    const decoded = jwt.verify(token, `${process.env.JWT_SECRET}`) as jwt.JwtPayload;
    const { id, email } = decoded;

    // Try candidate first
    const existCandidate = await AccountCandidate.findOne({
      _id: id,
      email: email
    });

    if(existCandidate) {
      req.account = existCandidate;
      req.accountType = "candidate";
      next();
      return;
    }

    // Try company
    const existCompany = await AccountCompany.findOne({
      _id: id,
      email: email
    });

    if(existCompany) {
      req.account = existCompany;
      req.accountType = "company";
      next();
      return;
    }

    // Token invalid
    req.account = null as any;
    req.accountType = "guest";
    next();
  } catch (error) {
    req.account = null as any;
    req.accountType = "guest";
    next();
  }
}