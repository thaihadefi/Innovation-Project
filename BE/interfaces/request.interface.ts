import { Request } from "express";

export interface RequestAccount extends Request {
  account?: any;
  accountType?: "candidate" | "company" | "guest";
}