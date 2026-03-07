import { Request, Response } from "express";
import InterviewExperience from "../models/interview-experience.model";
import AccountAdmin from "../models/account-admin.model";
import Role from "../models/role.model";
import { queueEmail } from "../helpers/queue.helper";
import { emailTemplates } from "../helpers/email-template.helper";
import { RequestAccount } from "../interfaces/request.interface";

const PAGE_SIZE = 10;

export const list = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1")) || 1);
    const keyword = String(req.query.keyword || "").trim();
    const result = req.query.result as string | undefined;
    const difficulty = req.query.difficulty as string | undefined;

    const filter: any = { status: "approved", deleted: false };
    if (keyword) filter.$or = [
      { title: { $regex: keyword, $options: "i" } },
      { companyName: { $regex: keyword, $options: "i" } },
      { position: { $regex: keyword, $options: "i" } },
    ];
    if (result && ["passed", "failed", "pending"].includes(result)) filter.result = result;
    if (difficulty && ["easy", "medium", "hard"].includes(difficulty)) filter.difficulty = difficulty;

    const skip = (page - 1) * PAGE_SIZE;
    const [total, posts] = await Promise.all([
      InterviewExperience.countDocuments(filter),
      InterviewExperience.find(filter)
        .select("title companyName position result difficulty authorName isAnonymous createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(PAGE_SIZE)
        .lean(),
    ]);

    res.json({
      code: "success",
      posts,
      pagination: {
        totalRecord: total,
        totalPage: Math.max(1, Math.ceil(total / PAGE_SIZE)),
        currentPage: page,
        pageSize: PAGE_SIZE,
      },
    });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const detail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const post = await InterviewExperience.findOne({
      _id: id,
      status: "approved",
      deleted: false,
    }).select("-__v -deleted").lean();

    if (!post) {
      res.status(404).json({ code: "error", message: "Post not found." });
      return;
    }
    res.json({ code: "success", post });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const update = async (req: RequestAccount, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, companyName, position, result, difficulty, isAnonymous } = req.body;
    const post = await InterviewExperience.findOne({ _id: id, authorId: req.account._id, deleted: false });
    if (!post) {
      res.status(404).json({ code: "error", message: "Post not found or access denied." });
      return;
    }
    post.title = title;
    post.content = content;
    post.companyName = companyName;
    post.position = position;
    post.result = result;
    post.difficulty = difficulty;
    post.isAnonymous = !!isAnonymous;
    post.status = "pending";
    await post.save();
    res.json({ code: "success", message: "Post updated and pending re-review." });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const remove = async (req: RequestAccount, res: Response) => {
  try {
    const { id } = req.params;
    const post = await InterviewExperience.findOneAndUpdate(
      { _id: id, authorId: req.account._id, deleted: false },
      { $set: { deleted: true } }
    );
    if (!post) {
      res.status(404).json({ code: "error", message: "Post not found or access denied." });
      return;
    }
    res.json({ code: "success", message: "Post deleted." });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const create = async (req: RequestAccount, res: Response) => {
  try {
    const { title, content, companyName, position, result, difficulty, isAnonymous } = req.body;
    const post = new InterviewExperience({
      title,
      content,
      companyName,
      position,
      result: result || "pending",
      difficulty,
      authorId: req.account._id,
      authorName: req.account.fullName,
      isAnonymous: !!isAnonymous,
      status: "pending",
    });
    await post.save();

    // Notify admins with experiences_manage permission (fire-and-forget)
    (async () => {
      try {
        const roles = await Role.find({ permissions: "experiences_manage" }).select("_id").lean();
        const roleIds = roles.map((r: any) => r._id);
        const admins = await AccountAdmin.find({
          status: "active",
          deleted: false,
          $or: [{ isSuperAdmin: true }, { role: { $in: roleIds } }],
        }).select("email").lean();
        const { subject, html } = emailTemplates.experienceSubmittedAdmin(req.account.fullName, title);
        admins.forEach((admin: any) => queueEmail(admin.email, subject, html));
      } catch {
        // Non-critical — do not affect response
      }
    })();

    res.json({ code: "success", message: "Your post has been submitted and is pending review." });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};
