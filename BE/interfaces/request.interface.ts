import { Request } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { IAccountAdmin } from "./models/account-admin.interface";
import { IAccountCandidate } from "./models/account-candidate.interface";
import { IAccountCompany } from "./models/account-company.interface";

export type AccountType = "candidate" | "company" | "guest";
export type AccountDoc = IAccountCandidate | IAccountCompany;

export interface RequestAccount<
  P = ParamsDictionary,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = ParsedQs,
  TAccount = AccountDoc
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  account?: TAccount | null;
  accountType?: AccountType;
}

export interface RequestCandidate<
  P = ParamsDictionary,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = ParsedQs
> extends RequestAccount<P, ResBody, ReqBody, ReqQuery, IAccountCandidate> {
  account?: IAccountCandidate;
  accountType?: "candidate";
}

export interface RequestCompany<
  P = ParamsDictionary,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = ParsedQs
> extends RequestAccount<P, ResBody, ReqBody, ReqQuery, IAccountCompany> {
  account?: IAccountCompany;
  accountType?: "company";
}

export interface RequestAdmin<
  P = ParamsDictionary,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = ParsedQs
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  admin?: IAccountAdmin | null;
  permissions?: string[] | null;
}
