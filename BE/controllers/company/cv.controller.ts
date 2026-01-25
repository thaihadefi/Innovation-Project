import { Response } from "express";
import { RequestAccount } from "../../interfaces/request.interface";
import Job from "../../models/job.model";
import CV from "../../models/cv.model";
import AccountCompany from "../../models/account-company.model";
import AccountCandidate from "../../models/account-candidate.model";
import Notification from "../../models/notification.model";
import { deleteImage } from "../../helpers/cloudinary.helper";
import { convertToSlug } from "../../helpers/slugify.helper";
import { normalizeTechnologyName } from "../../helpers/technology.helper";
import { queueEmail } from "../../helpers/mail.helper";
import { notifyCandidate } from "../../helpers/socket.helper";

export const getCVList = async (req: RequestAccount, res: Response) => {
  try {
    const companyId = req.account.id;

    const jobList = await Job
      .find({
        companyId: companyId
      })
      .lean();

    const jobListId = jobList.map(item => item._id);
    
    const cvList = await CV
      .find({
        jobId: { $in: jobListId }
      })
      .sort({
        createdAt: "desc"
      })
      .lean();

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
      message: "Success!",
      cvList: dataFinal
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Invalid data!"
    })
  }
}

export const getCVDetail = async (req: RequestAccount, res: Response) => {
  try {
    const companyId = req.account.id;
    const cvId = req.params.id;

    // Validate ObjectId format
    if (!cvId || !/^[a-fA-F0-9]{24}$/.test(cvId)) {
      res.json({ code: "error", message: "CV not found!" });
      return;
    }

    const infoCV = await CV.findOne({
      _id: cvId
    }).select('fullName email phone fileCV status jobId viewed createdAt') // OPTIMIZED: Only needed fields

    if(!infoCV) {
      res.json({
        code: "error",
        message: "CV not found!"
      });
      return;
    }

    const infoJob = await Job.findOne({
      _id: infoCV.jobId,
      companyId: companyId
    }).select('title') // OPTIMIZED: Only need title

    if(!infoJob) {
      res.json({
        code: "error",
        message: "CV not found!"
      });
      return;
    }

    // OPTIMIZED: Lookup candidate - select only isVerified
    const candidateInfo = await AccountCandidate.findOne({
      email: infoCV.email
    }).select('isVerified').lean();

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
      technologies: infoJob.technologies,
      technologySlugs: (infoJob.technologies || []).map((t: string) => convertToSlug(normalizeTechnologyName(t))),
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
          const company = await AccountCompany.findById(companyId).select('companyName'); // OPTIMIZED: Only need name
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
      message: "Success!",
      cvDetail: dataFinalCV,
      jobDetail: dataFinalJob
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Invalid data!"
    })
  }
}

export const changeStatusCVPatch = async (req: RequestAccount, res: Response) => {
  try {
    const companyId = req.account.id;
    const cvId = req.params.id;
    const { status } = req.body;

    // Validate ObjectId format
    if (!cvId || !/^[a-fA-F0-9]{24}$/.test(cvId)) {
      res.json({ code: "error", message: "CV not found!" });
      return;
    }

    const infoCV = await CV.findOne({
      _id: cvId
    }).select('jobId email status') // OPTIMIZED: Only needed fields

    if(!infoCV) {
      res.json({
        code: "error",
        message: "CV not found!"
      });
      return;
    }

    const infoJob = await Job.findOne({
      _id: infoCV.jobId,
      companyId: companyId
    }).select('title maxApproved approvedCount') // OPTIMIZED: Only needed fields

    if(!infoJob) {
      res.json({
        code: "error",
        message: "CV not found!"
      });
      return;
    }

    const oldStatus = infoCV.status;
    const newStatus = status;

    // Update approvedCount based on status change
    if (oldStatus !== newStatus) {
      // If changing TO approved, increment approvedCount
      if (newStatus === "approved" && oldStatus !== "approved") {
        // Check if max approved reached
        if (infoJob.maxApproved && infoJob.maxApproved > 0) {
          if ((infoJob.approvedCount || 0) >= infoJob.maxApproved) {
            res.json({
              code: "error",
              message: "Maximum approved candidates reached!"
            });
            return;
          }
        }
        await Job.updateOne(
          { _id: infoCV.jobId },
          { $inc: { approvedCount: 1 } }
        );
      }
      // If changing FROM approved to something else, decrement approvedCount
      else if (oldStatus === "approved" && newStatus !== "approved") {
        await Job.updateOne(
          { _id: infoCV.jobId },
          { $inc: { approvedCount: -1 } }
        );
      }
    }

    // Update CV status
    await CV.updateOne({
      _id: cvId
    }, {
      status: status
    });

    // Notify candidate about status change
    if (oldStatus !== newStatus && (newStatus === "approved" || newStatus === "rejected")) {
      try {
        // Find candidate by email
        const candidate = await AccountCandidate.findOne({ email: infoCV.email }).select('_id'); // OPTIMIZED: Only need id
        if (candidate) {
          const company = await AccountCompany.findById(companyId).select('companyName'); // OPTIMIZED: Only need name
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
      message: "Status changed!"
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Invalid data!"
    })
  }
}

export const deleteCVDel = async (req: RequestAccount, res: Response) => {
  try {
    const companyId = req.account.id;
    const cvId = req.params.id;

    // Validate ObjectId format
    if (!cvId || !/^[a-fA-F0-9]{24}$/.test(cvId)) {
      res.json({ code: "error", message: "CV not found!" });
      return;
    }

    const infoCV = await CV.findOne({
      _id: cvId
    }).select('jobId status') // OPTIMIZED: Only needed fields

    if(!infoCV) {
      res.json({
        code: "error",
        message: "CV not found!"
      });
      return;
    }

    const infoJob = await Job.findOne({
      _id: infoCV.jobId,
      companyId: companyId
    }).select('_id') // OPTIMIZED: Only need id for verification

    if(!infoJob) {
      res.json({
        code: "error",
        message: "CV not found!"
      });
      return;
    }

    // Update job counts before deleting CV
    const updateCounts: Record<string, number> = {
      applicationCount: -1  // Always decrement application count
    };
    if (infoCV.status === "approved") {
      updateCounts.approvedCount = -1;  // Decrement approved count if CV was approved
    }
    await Job.updateOne(
      { _id: infoCV.jobId },
      { $inc: updateCounts }
    );

    // Delete CV file from Cloudinary
    if (infoCV.fileCV) {
      await deleteImage(infoCV.fileCV as string);
    }

    // Delete CV
    await CV.deleteOne({
      _id: cvId
    });
  
    res.json({
      code: "success",
      message: "CV deleted!"
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Invalid data!"
    })
  }
}
