import { Response } from "express";
import { RequestAccount } from "../../interfaces/request.interface";
import Job from "../../models/job.model";
import CV from "../../models/cv.model";
import AccountCompany from "../../models/account-company.model";
import AccountCandidate from "../../models/account-candidate.model";
import Notification from "../../models/notification.model";
import { deleteImage } from "../../helpers/cloudinary.helper";
import { normalizeSkillKey } from "../../helpers/skill.helper";
import { queueEmail } from "../../helpers/mail.helper";
import { notifyCandidate } from "../../helpers/socket.helper";
import { invalidateJobDiscoveryCaches } from "../../helpers/cache-invalidation.helper";
import { paginationConfig } from "../../config/variable";
import { findIdsByKeyword } from "../../helpers/atlas-search.helper";

export const getCVList = async (req: RequestAccount, res: Response) => {
  try {
    const companyId = req.account.id;
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const pageSize = paginationConfig.companyCVList || 6;
    const skip = (page - 1) * pageSize;
    const keyword = String(req.query.keyword || "").trim();

    const jobFind: any = { companyId: companyId };
    let matchedJobIds: string[] = [];
    if (keyword) {
      matchedJobIds = await findIdsByKeyword({
        model: Job,
        keyword,
        atlasPaths: "title",
        atlasMatch: { companyId: companyId } as any,
      });
    }

    const jobList = await Job
      .find(jobFind)
      .select("_id title salaryMin salaryMax position workingForm")
      .lean();

    const jobListId = jobList.map(item => item._id);
    if (jobListId.length === 0) {
      res.json({
        code: "success",
        message: "Success.",
        cvList: [],
        pagination: {
          totalRecord: 0,
          totalPage: 1,
          currentPage: page,
          pageSize
        }
      });
      return;
    }

    const cvFind: any = {
      jobId: { $in: jobListId }
    };
    if (keyword) {
      const matchedCvIdsByProfile = await findIdsByKeyword({
        model: CV,
        keyword,
        atlasPaths: ["fullName", "email"],
        atlasMatch: { jobId: { $in: jobListId } } as any,
      });
      const matchedCvIdsByJob = matchedJobIds.length > 0
        ? await CV.find({ jobId: { $in: matchedJobIds } }).select("_id").lean()
        : [];
      const matchedCvIds = [
        ...new Set([
          ...matchedCvIdsByProfile,
          ...matchedCvIdsByJob.map((cv: any) => cv._id.toString())
        ])
      ];
      cvFind._id = { $in: matchedCvIds };
    }
    
    const [totalRecord, cvList] = await Promise.all([
      CV.countDocuments(cvFind),
      CV
        .find(cvFind)
        .sort({
          createdAt: "desc"
        })
        .skip(skip)
        .limit(pageSize)
        .lean()
    ]);

    // Create job map for O(1) lookups (bulk fetch already done above)
    const jobMap = new Map(jobList.map(j => [j._id.toString(), j]));

    const dataFinal = [];

    for (const item of cvList) {
      const jobInfo = jobMap.get(item.jobId?.toString() || '');
      if(jobInfo) {
        const itemFinal = {
          id: item._id,
          jobTitle: jobInfo.title,
          fullName: item.fullName,
          email: item.email,
          phone: item.phone,
          salaryMin: jobInfo.salaryMin,
          salaryMax: jobInfo.salaryMax,
          position: jobInfo.position,
          workingForm: jobInfo.workingForm,
          viewed: item.viewed,
          status: item.status,
        };
        dataFinal.push(itemFinal);
      }
    }
  
    res.json({
      code: "success",
      message: "Success.",
      cvList: dataFinal,
      pagination: {
        totalRecord,
        totalPage: Math.max(1, Math.ceil(totalRecord / pageSize)),
        currentPage: page,
        pageSize
      }
    })
  } catch (error) {
    res.status(500).json({
      code: "error",
      message: "Internal server error."
    })
  }
}

export const getCVDetail = async (req: RequestAccount<{ id: string }>, res: Response) => {
  try {
    const companyId = req.account.id;
    const cvId = req.params.id;

    // Validate ObjectId format
    if (!cvId || !/^[a-fA-F0-9]{24}$/.test(cvId)) {
      res.status(400).json({
        code: "error",
        message: "Invalid CV ID."
      });
      return;
    }

    const infoCV = await CV.findOne({
      _id: cvId
    }).select('fullName email phone fileCV status jobId viewed createdAt') // Only needed fields

    if(!infoCV) {
      res.status(404).json({
      code: "error",
      message: "CV not found."
      });
      return;
    }

    const infoJob = await Job.findOne({
      _id: infoCV.jobId,
      companyId: companyId
    }).select(
      "title slug salaryMin salaryMax position workingForm skills"
    )

    if(!infoJob) {
      res.status(404).json({
      code: "error",
      message: "CV not found."
      });
      return;
    }

    // Lookup candidate - select only isVerified
    const candidateInfo = await AccountCandidate.findOne({
      email: infoCV.email
    }).select('isVerified studentId').lean();

    const dataFinalCV = {
      fullName: infoCV.fullName,
      email: infoCV.email,
      phone: infoCV.phone,
      fileCV: infoCV.fileCV,
      status: infoCV.status,
      isVerified: candidateInfo?.isVerified || false,
      studentId: candidateInfo?.studentId || null,
    };

    const dataFinalJob = {
      id: infoJob.id,
      slug: infoJob.slug,
      title: infoJob.title,
      salaryMin: infoJob.salaryMin,
      salaryMax: infoJob.salaryMax,
      position: infoJob.position,
      workingForm: infoJob.workingForm,
      skills: infoJob.skills,
      skillSlugs: (infoJob.skills || []).map((t: string) => normalizeSkillKey(t)),
    };

    // Update status to viewed (only if still initial/pending)
    if (infoCV.status === "initial") {
      await CV.updateOne({
        _id: cvId
      }, {
        viewed: true,
        status: "viewed"
      });

      // Notify candidate that their CV was viewed
      try {
        if (candidateInfo) {
          const company = await AccountCompany.findById(companyId).select('companyName').lean(); // Only need name
          const viewNotif = await Notification.create({
            candidateId: candidateInfo._id,
            type: "application_viewed",
            title: "CV Viewed!",
            message: `${company?.companyName || "A company"} has viewed your application for ${infoJob.title}`,
            link: `/candidate-manage/cv/list`,
            read: false,
            data: {
              jobId: infoJob._id,
              jobTitle: infoJob.title,
              cvId: infoCV._id,
              companyName: company?.companyName
            }
          });
          
          // Push real-time notification via Socket.IO
          notifyCandidate(candidateInfo._id.toString(), viewNotif);
        }
      } catch (err) {
      }
    }
  
    res.json({
      code: "success",
      message: "Success.",
      cvDetail: dataFinalCV,
      jobDetail: dataFinalJob
    })
  } catch (error) {
    res.status(500).json({
      code: "error",
      message: "Internal server error."
    })
  }
}

export const changeStatusCVPatch = async (req: RequestAccount<{ id: string }>, res: Response) => {
  try {
    const companyId = req.account.id;
    const cvId = req.params.id;
    const { status } = req.body;

    // Validate ObjectId format
    if (!cvId || !/^[a-fA-F0-9]{24}$/.test(cvId)) {
      res.status(400).json({
        code: "error",
        message: "Invalid CV ID."
      });
      return;
    }

    // Validate status is an allowed enum value
    const allowedStatuses = ["viewed", "approved", "rejected"];
    if (!status || !allowedStatuses.includes(status)) {
      res.status(400).json({
        code: "error",
        message: "Invalid status value."
      });
      return;
    }

    const infoCV = await CV.findOne({
      _id: cvId
    }).select('jobId email status').lean() // Only needed fields

    if(!infoCV) {
      res.status(404).json({
      code: "error",
      message: "CV not found."
      });
      return;
    }

    const infoJob = await Job.findOne({
      _id: infoCV.jobId,
      companyId: companyId
    }).select('title maxApproved approvedCount').lean() // Only needed fields

    if(!infoJob) {
      res.status(404).json({
      code: "error",
      message: "CV not found."
      });
      return;
    }

    const oldStatus = infoCV.status;
    const newStatus = status;

    // Update approvedCount based on status change (atomic + conditional)
    if (oldStatus !== newStatus) {
      // If changing TO approved, increment approvedCount only if capacity allows
      if (newStatus === "approved" && oldStatus !== "approved") {
        const approveResult = await Job.updateOne(
          {
            _id: infoCV.jobId,
            $or: [
              { maxApproved: { $exists: false } },
              { maxApproved: 0 },
              { $expr: { $lt: ["$approvedCount", "$maxApproved"] } }
            ]
          },
          { $inc: { approvedCount: 1 } }
        );

        if (approveResult.matchedCount === 0) {
          res.status(409).json({
      code: "error",
      message: "Maximum approved candidates reached."
          });
          return;
        }

        // Update CV status; roll back count if update fails
        const cvUpdate = await CV.updateOne(
          { _id: cvId, status: oldStatus },
          { status: newStatus }
        );
        if (cvUpdate.matchedCount === 0) {
          await Job.updateOne(
            { _id: infoCV.jobId },
            { $inc: { approvedCount: -1 } }
          );
          res.status(500).json({
            code: "error",
            message: "CV status update failed."
          });
          return;
        }
      }
      // If changing FROM approved to something else, update CV then decrement
      else if (oldStatus === "approved" && newStatus !== "approved") {
        const cvUpdate = await CV.updateOne(
          { _id: cvId, status: oldStatus },
          { status: newStatus }
        );
        if (cvUpdate.matchedCount === 0) {
          res.status(500).json({
            code: "error",
            message: "CV status update failed."
          });
          return;
        }
        await Job.updateOne(
          { _id: infoCV.jobId },
          { $inc: { approvedCount: -1 } }
        );
      } else {
        // Other status changes (no approved count impact)
        await CV.updateOne(
          { _id: cvId, status: oldStatus },
          { status: newStatus }
        );
      }
    }

    // approvedCount/status changed; invalidate discovery/count caches
    await invalidateJobDiscoveryCaches();

    // Notify candidate about status change
    if (oldStatus !== newStatus && (newStatus === "approved" || newStatus === "rejected")) {
      try {
        // Find candidate by email
        const candidate = await AccountCandidate.findOne({ email: infoCV.email }).select('_id').lean(); // Only need id
        if (candidate) {
          const company = await AccountCompany.findById(companyId).select('companyName').lean(); // Only need name
          const notifType = newStatus === "approved" ? "application_approved" : "application_rejected";
          const notifTitle = newStatus === "approved" ? "Application Approved!" : "Application Update";
          const notifMessage = newStatus === "approved" 
            ? `Congratulations! Your application for ${infoJob.title} at ${company?.companyName || "the company"} has been approved!`
            : `Your application for ${infoJob.title} at ${company?.companyName || "the company"} was not selected.`;

          const statusNotif = await Notification.create({
            candidateId: candidate._id,
            type: notifType,
            title: notifTitle,
            message: notifMessage,
            link: `/candidate-manage/cv/view/${infoCV._id}`,
            read: false,
            data: {
              jobId: infoJob._id,
              jobTitle: infoJob.title,
              cvId: infoCV._id,
              companyName: company?.companyName
            }
          });
          
          // Push real-time notification via Socket.IO
          notifyCandidate(candidate._id.toString(), statusNotif);

          // Send email to candidate about status change
          const emailSubject = newStatus === "approved" 
            ? `Congratulations! Your application for ${infoJob.title} was approved!`
            : `Update on your application for ${infoJob.title}`;
          const emailContent = newStatus === "approved"
            ? `
              <h2>Congratulations!</h2>
              <p>Your application for <strong>${infoJob.title}</strong> at <strong>${company?.companyName || "the company"}</strong> has been <span style="color: green; font-weight: bold;">approved</span>!</p>
              <p>The company will contact you soon for next steps.</p>
              <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3069'}/candidate-manage/cv/list">View your applications</a></p>
            `
            : `
              <h2>Application Update</h2>
              <p>Your application for <strong>${infoJob.title}</strong> at <strong>${company?.companyName || "the company"}</strong> was not selected this time.</p>
              <p>Don't give up! Check out other opportunities on our platform.</p>
              <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3069'}/search">Find more jobs</a></p>
            `;
          if (infoCV.email) {
            queueEmail(infoCV.email, emailSubject, emailContent);
          }
        }
      } catch (err) {
      }
    }
  
    res.json({
      code: "success",
      message: "Status changed."
    })
  } catch (error) {
    res.status(500).json({
      code: "error",
      message: "Internal server error."
    })
  }
}

export const deleteCVDel = async (req: RequestAccount<{ id: string }>, res: Response) => {
  try {
    const companyId = req.account.id;
    const cvId = req.params.id;

    // Validate ObjectId format
    if (!cvId || !/^[a-fA-F0-9]{24}$/.test(cvId)) {
      res.status(400).json({
        code: "error",
        message: "Invalid CV ID."
      });
      return;
    }

    const infoCV = await CV.findOne({
      _id: cvId
    }).select('jobId status fileCV') // fileCV needed for Cloudinary cleanup on delete

    if(!infoCV) {
      res.status(404).json({
      code: "error",
      message: "CV not found."
      });
      return;
    }

    const infoJob = await Job.findOne({
      _id: infoCV.jobId,
      companyId: companyId
    }).select('_id') // Only need id for verification

    if(!infoJob) {
      res.status(404).json({
      code: "error",
      message: "CV not found."
      });
      return;
    }

    // Update job counts before deleting CV (separate ops to allow independent floor guards)
    await Job.updateOne(
      { _id: infoCV.jobId, applicationCount: { $gt: 0 } },
      { $inc: { applicationCount: -1 } }
    );
    if (infoCV.status === "approved") {
      await Job.updateOne(
        { _id: infoCV.jobId, approvedCount: { $gt: 0 } },
        { $inc: { approvedCount: -1 } }
      );
    }

    // Delete CV file from Cloudinary
    if (infoCV.fileCV) {
      await deleteImage(infoCV.fileCV as string);
    }

    // Delete CV
    await CV.deleteOne({
      _id: cvId
    });

    // applicationCount/approvedCount changed; invalidate discovery/count caches
    await invalidateJobDiscoveryCaches();
  
    res.json({
      code: "success",
      message: "CV deleted."
    })
  } catch (error) {
    res.status(500).json({
      code: "error",
      message: "Internal server error."
    })
  }
}
