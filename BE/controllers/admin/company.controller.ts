import { Response } from "express";
import AccountCompany from "../../models/account-company.model";
import { RequestAdmin } from "../../interfaces/request.interface";
import { adminPaginationConfig } from "../../config/variable";

export const list = async (req: RequestAdmin, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1")) || 1);
    const pageSize = adminPaginationConfig.companies;
    const skip = (page - 1) * pageSize;
    const status = req.query.status as string | undefined;
    const keyword = String(req.query.keyword || "").trim();

    const filter: any = {};
    if (status && ["initial", "active", "inactive"].includes(status)) filter.status = status;
    if (keyword) filter.$or = [
      { companyName: { $regex: keyword, $options: "i" } },
      { email: { $regex: keyword, $options: "i" } },
    ];

    const [total, companies] = await Promise.all([
      AccountCompany.countDocuments(filter),
      AccountCompany.find(filter)
        .select("companyName email phone location status slug logo createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
    ]);

    res.json({
      code: "success",
      companies,
      pagination: {
        totalRecord: total,
        totalPage: Math.max(1, Math.ceil(total / pageSize)),
        currentPage: page,
        pageSize,
      },
    });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const setStatus = async (req: RequestAdmin, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["active", "inactive", "initial"].includes(status)) {
      res.status(400).json({ code: "error", message: "Invalid status." });
      return;
    }
    const result = await AccountCompany.updateOne({ _id: id }, { status });
    if (result.matchedCount === 0) {
      res.status(404).json({ code: "error", message: "Company not found." });
      return;
    }
    const messages: Record<string, string> = {
      active: "Company approved and activated.",
      inactive: "Company banned.",
      initial: "Company status reset to pending.",
    };
    res.json({ code: "success", message: messages[status] });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};
