import { Response } from "express";

export const setNoCacheHeaders = (res: Response, varyCookie = false): void => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  if (varyCookie) {
    res.setHeader("Vary", "Cookie");
  }
};

export const serverError = (
  res: Response,
  message = "Internal server error."
): void => {
  res.status(500).json({ code: "error", message });
};

export const unauthorized = (
  res: Response,
  message = "Unauthorized."
): void => {
  res.status(401).json({ code: "error", message });
};

export const badRequest = (
  res: Response,
  message = "Bad request."
): void => {
  res.status(400).json({ code: "error", message });
};

export const forbidden = (
  res: Response,
  message = "Forbidden."
): void => {
  res.status(403).json({ code: "error", message });
};

export const notFound = (
  res: Response,
  message = "Resource not found."
): void => {
  res.status(404).json({ code: "error", message });
};

export const conflict = (
  res: Response,
  message = "Conflict."
): void => {
  res.status(409).json({ code: "error", message });
};
