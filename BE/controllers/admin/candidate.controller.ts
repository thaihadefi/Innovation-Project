import { Response } from "express";
import AccountCandidate from "../../models/account-candidate.model";
import { RequestAdmin } from "../../interfaces/request.interface";
import { adminPaginationConfig } from "../../config/variable";

export const list = async (req: RequestAdmin, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1")) || 1);
    const pageSize = adminPaginationConfig.candidates;
    const skip = (page - 1) * pageSize;
    const status = req.query.status as string | undefined;
    const keyword = String(req.query.keyword || "").trim();
    const verified = req.query.verified as string | undefined;

    const filter: any = {};
    if (status && ["active", "inactive"].includes(status)) filter.status = status;
    if (verified === "true") filter.isVerified = true;
    if (verified === "false") filter.isVerified = false;
    if (keyword) filter.$or = [
      { fullName: { $regex: keyword, $options: "i" } },
      { email: { $regex: keyword, $options: "i" } },
      { studentId: { $regex: keyword, $options: "i" } },
    ];

    const [total, candidates] = await Promise.all([
      AccountCandidate.countDocuments(filter),
      AccountCandidate.find(filter)
        .select("fullName email phone studentId cohort major isVerified status createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
    ]);

    res.json({
      code: "success",
      candidates,
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

export const setVerified = async (req: RequestAdmin, res: Response) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;
    if (typeof isVerified !== "boolean") {
      res.status(400).json({ code: "error", message: "isVerified must be a boolean." });
      return;
    }
    const result = await AccountCandidate.updateOne({ _id: id }, { isVerified });
    if (result.matchedCount === 0) {
      res.status(404).json({ code: "error", message: "Candidate not found." });
      return;
    }
    res.json({ code: "success", message: isVerified ? "Student verified." : "Verification removed." });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const setStatus = async (req: RequestAdmin, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      res.status(400).json({ code: "error", message: "Invalid status." });
      return;
    }
    const result = await AccountCandidate.updateOne({ _id: id }, { status });
    if (result.matchedCount === 0) {
      res.status(404).json({ code: "error", message: "Candidate not found." });
      return;
    }
    res.json({ code: "success", message: status === "inactive" ? "Candidate banned." : "Candidate unbanned." });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};
