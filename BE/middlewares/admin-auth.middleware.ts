import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import AccountAdmin from "../models/account-admin.model";
import Role from "../models/role.model";
import { RequestAdmin } from "../interfaces/request.interface";

// Verify admin JWT from adminToken cookie, load role permissions
export const verifyAdminToken = async (req: RequestAdmin, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.adminToken;

    if (!token) {
      res.status(401).json({ code: "error", message: "Please login to continue." });
      return;
    }

    const decoded = jwt.verify(token, `${process.env.JWT_SECRET}`) as jwt.JwtPayload;
    if (typeof decoded.id !== "string" || typeof decoded.email !== "string") {
      res.status(401).json({ code: "error", message: "Invalid token." });
      return;
    }

    const admin = await AccountAdmin.findOne({
      _id: decoded.id,
      email: decoded.email,
      deleted: false,
    });

    if (!admin) {
      res.status(401).json({ code: "error", message: "Invalid token." });
      return;
    }

    if (admin.status !== "active") {
      res.status(403).json({ code: "error", message: "Account is not activated." });
      return;
    }

    // Load permissions from role
    req.permissions = [];
    if (admin.role) {
      const role = await Role.findOne({ _id: admin.role, deleted: false });
      if (role) {
        req.permissions = role.permissions as string[];
      }
    }

    req.admin = admin;
    next();
  } catch {
    res.status(401).json({ code: "error", message: "Invalid token." });
  }
};

// Permission guard factory — use after verifyAdminToken
export const requirePermission = (permission: string) => {
  return (req: RequestAdmin, res: Response, next: NextFunction) => {
    if (!req.permissions?.includes(permission)) {
      res.status(403).json({ code: "error", message: "You do not have permission to perform this action." });
      return;
    }
    next();
  };
};
