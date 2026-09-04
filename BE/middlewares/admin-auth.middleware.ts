import { NextFunction, Response } from "express";
import AccountAdmin from "../models/account-admin.model";
import Role from "../models/role.model";
import { RequestAdmin } from "../interfaces/request.interface";
import { verifyAuthToken, AuthTokenPayload } from "../helpers/jwt.helper";
import { IRole } from "../interfaces/models/role.interface";

export const verifyAdminToken = async (req: RequestAdmin, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies.adminToken as string | undefined;

    if (!token) {
      res.status(401).json({ code: "error", message: "Please login to continue." });
      return;
    }

    const payload = verifyAuthToken<AuthTokenPayload>(token);
    if (!payload || payload.role !== "admin") {
      res.status(401).json({ code: "error", message: "Invalid token." });
      return;
    }

    const admin = await AccountAdmin.findOne({
      _id: payload.id,
      email: payload.email,
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

    req.permissions = [];
    if (admin.isSuperAdmin) {
      req.permissions = null;
    } else if (admin.role) {
      const role = await Role.findOne({ _id: admin.role, deleted: false }).lean<IRole>();
      if (role) {
        req.permissions = role.permissions;
      }
    }

    req.admin = admin;
    next();
  } catch {
    res.status(401).json({ code: "error", message: "Invalid token." });
  }
};

export const requirePermission = (permission: string) => {
  return (req: RequestAdmin, res: Response, next: NextFunction): void => {
    if (req.admin?.isSuperAdmin) {
      next();
      return;
    }
    if (!req.permissions?.includes(permission)) {
      res.status(403).json({ code: "error", message: "You do not have permission to perform this action." });
      return;
    }
    next();
  };
};
