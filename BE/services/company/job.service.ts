import { FilterQuery, Types } from "mongoose";
import Job from "../../models/job.model";
import Location from "../../models/location.model";
import CV from "../../models/cv.model";
import FollowCompany from "../../models/follow-company.model";
import Notification from "../../models/notification.model";
import AccountCandidate from "../../models/account-candidate.model";
import JobView from "../../models/job-view.model";
import SavedJob from "../../models/saved-job.model";
import { deleteImages } from "../../helpers/cloudinary.helper";
import { generateUniqueSlug } from "../../helpers/slugify.helper";
import { normalizeSkills } from "../../helpers/skill.helper";
import { sanitizeRichText } from "../../helpers/sanitize-rich-text.helper";
import { invalidateJobDiscoveryCaches } from "../../helpers/cache-invalidation.helper";
import { notificationConfig, paginationConfig } from "../../config/variable";
import { sendEmail } from "../../helpers/mail.helper";
import { emailTemplates } from "../../helpers/email-template.helper";
import { findIdsByKeyword } from "../../helpers/atlas-search.helper";
import { IJob } from "../../interfaces/models/job.interface";
import { ICV } from "../../interfaces/models/cv.interface";
import { ILocation } from "../../interfaces/models/location.interface";
import { IAccountCandidate } from "../../interfaces/models/account-candidate.interface";

export interface CreateCompanyJobDTO {
  companyId: Types.ObjectId;
  companyName: string;
  title: string;
  salaryMin?: number | string;
  salaryMax?: number | string;
  maxApplications?: number | string;
  maxApproved?: number | string;
  expirationDate?: string | Date | null;
  position?: string;
  workingForm?: string;
  skills?: string[] | string;
  locations?: string | string[];
  description?: string;
  benefit?: string;
  requirement?: string;
  files?: Array<{ path: string }>;
}

export interface EditCompanyJobDTO {
  title?: string;
  salaryMin?: number | string;
  salaryMax?: number | string;
  maxApplications?: number | string;
  maxApproved?: number | string;
  expirationDate?: string | Date | null;
  position?: string;
  workingForm?: string;
  skills?: string[] | string;
  locations?: string | string[];
  description?: string;
  benefit?: string;
  requirement?: string;
  imageOrder?: string;
  existingImages?: string;
  files?: Array<{ path: string }>;
}

export interface CompanyJobListItemDTO {
  id: Types.ObjectId;
  title: string;
  slug: string;
  salaryMin?: number;
  salaryMax?: number;
  position?: string;
  workingForm?: string;
  skills: string[];
  jobLocations: string[];
  maxApplications: number;
  applicationCount: number;
  maxApproved: number;
  approvedCount: number;
}

export const sendJobNotificationsToFollowers = async (
  companyId: string,
  companyName: string,
  jobId: string,
  jobTitle: string,
  jobSlug: string
): Promise<void> => {
  try {
    const followers = await FollowCompany.find({ companyId: new Types.ObjectId(companyId) }).select("candidateId").lean();
    if (followers.length === 0) return;

    const notifications = followers.map(f => ({
      candidateId: f.candidateId,
      type: "new_job" as const,
      title: "New Job Posted!",
      message: `${companyName} just posted a new job: ${jobTitle}`,
      link: `/job/detail/${jobSlug}`,
      read: false,
      data: {
        companyId: new Types.ObjectId(companyId),
        companyName,
        jobId: new Types.ObjectId(jobId),
        jobTitle
      }
    }));

    await Notification.insertMany(notifications);

    const followerIds = followers.map(f => f.candidateId);
    const followerAccounts = await AccountCandidate.find({ _id: { $in: followerIds } })
      .select("email")
      .lean<Pick<IAccountCandidate, "email">[]>();
    const emails = followerAccounts
      .map(c => c.email)
      .filter((e): e is string => typeof e === "string" && e.trim().length > 0);

    if (emails.length > 0) {
      const { subject, html } = emailTemplates.newJobPosted(companyName, jobTitle, jobSlug);
      for (const email of emails) {
        void sendEmail(email, subject, html).catch(() => {});
      }
    }

    const candidateIds = followers.map(f => f.candidateId);
    interface NotificationGroupResult {
      _id: Types.ObjectId;
      toDelete: Types.ObjectId[];
    }
    const notificationsToDelete = await Notification.aggregate<NotificationGroupResult>([
      { $match: { candidateId: { $in: candidateIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$candidateId",
          notifications: { $push: "$_id" }
        }
      },
      {
        $project: {
          toDelete: { $slice: ["$notifications", notificationConfig.maxStored, 1000] }
        }
      }
    ]);

    const idsToDelete = notificationsToDelete.flatMap(n => n.toDelete);
    if (idsToDelete.length > 0) {
      await Notification.deleteMany({ _id: { $in: idsToDelete } });
    }
  } catch (error) {
    console.error("[Job] Failed to send follower notifications:", error);
  }
};

export const createCompanyJobService = async (
  input: CreateCompanyJobDTO
): Promise<{ status: number; code: string; message: string }> => {
  const { companyId, companyName, files, ...body } = input;
  const cleanupFiles = () => {
    if (files && files.length > 0) {
      void deleteImages(files.map(f => f.path)).catch(() => {});
    }
  };

  const salaryMin = body.salaryMin ? parseInt(String(body.salaryMin)) : 0;
  const salaryMax = body.salaryMax ? parseInt(String(body.salaryMax)) : 0;
  const maxApplications = body.maxApplications ? parseInt(String(body.maxApplications)) : 0;
  const maxApproved = body.maxApproved ? parseInt(String(body.maxApproved)) : 0;

  let expirationDate: Date | null = null;
  if (body.expirationDate && body.expirationDate !== "") {
    expirationDate = new Date(body.expirationDate);
  }

  const skills = normalizeSkills(body.skills as string[]);
  if (!skills || skills.length === 0) {
    cleanupFiles();
    return { status: 400, code: "error", message: "Please provide at least one valid skill for the job." };
  }

  let locations: Types.ObjectId[] = [];
  if (body.locations) {
    if (typeof body.locations === "string") {
      try {
        const parsed = JSON.parse(body.locations) as string[];
        locations = parsed.map(id => new Types.ObjectId(id));
      } catch {
        locations = [];
      }
    } else if (Array.isArray(body.locations)) {
      locations = (body.locations as string[]).map(id => new Types.ObjectId(id));
    }
  }

  const images: string[] = [];
  if (files) {
    const seen = new Set<string>();
    for (const file of files) {
      if (!seen.has(file.path)) {
        seen.add(file.path);
        images.push(file.path);
      }
    }
  }

  if (images.length === 0) {
    return { status: 400, code: "error", message: "Please upload at least one image." };
  }

  const description = body.description ? sanitizeRichText(body.description) : "";

  const newRecord = new Job({
    companyId,
    title: body.title,
    salaryMin,
    salaryMax,
    maxApplications,
    maxApproved,
    expirationDate,
    position: body.position,
    workingForm: body.workingForm,
    skills,
    locations,
    description,
    images
  });

  await newRecord.save();
  newRecord.slug = generateUniqueSlug(body.title, newRecord.id);
  await newRecord.save();

  await invalidateJobDiscoveryCaches();
  void sendJobNotificationsToFollowers(companyId.toString(), companyName, newRecord.id, body.title, newRecord.slug);

  return { status: 200, code: "success", message: "Job created." };
};

export const getCompanyJobListService = async (
  companyId: Types.ObjectId,
  page: number,
  keyword?: string
): Promise<{
  code: string;
  message: string;
  jobList: CompanyJobListItemDTO[];
  totalPage: number;
  totalRecord: number;
  currentPage: number;
  pageSize: number;
}> => {
  const find: FilterQuery<IJob> = { companyId };
  if (keyword) {
    const kw = String(keyword).trim();
    const atlasIds = await findIdsByKeyword({
      model: Job,
      keyword: kw,
      atlasPaths: ["title", "description", "position", "workingForm"],
      atlasMatch: { companyId } as Record<string, unknown>,
    }).catch(() => [] as string[]);
    find._id = { $in: atlasIds.map(id => new Types.ObjectId(id)) };
  }

  const limitItems = paginationConfig.companyJobList;
  const skip = (page - 1) * limitItems;

  const [totalRecord, jobList] = await Promise.all([
    Job.countDocuments(find),
    Job.find(find)
      .select("title slug salaryMin salaryMax position workingForm skills locations images maxApplications maxApproved applicationCount approvedCount viewCount expirationDate createdAt")
      .sort({ createdAt: "desc" })
      .limit(limitItems)
      .skip(skip)
      .lean<IJob[]>()
  ]);
  const totalPage = Math.ceil(totalRecord / limitItems);

  const allLocationIds = [...new Set(
    jobList.flatMap(j => (j.locations || []))
      .map(id => id?.toString?.() || String(id))
      .filter(id => typeof id === "string" && /^[a-f\d]{24}$/i.test(id))
  )];
  const locations = allLocationIds.length > 0
    ? await Location.find({ _id: { $in: allLocationIds } }).select("name").lean<Pick<ILocation, "_id" | "name">[]>()
    : [];
  const locationMap = new Map(locations.map(c => [c._id.toString(), c.name]));

  const dataFinal: CompanyJobListItemDTO[] = [];
  for (const item of jobList) {
    const jobLocationNames = (item.locations || [])
      .map(locationId => locationMap.get(locationId?.toString?.() || String(locationId)))
      .filter((name): name is string => Boolean(name));

    dataFinal.push({
      id: item._id,
      title: item.title,
      slug: item.slug,
      salaryMin: item.salaryMin,
      salaryMax: item.salaryMax,
      position: item.position,
      workingForm: item.workingForm,
      skills: item.skills || [],
      jobLocations: jobLocationNames,
      maxApplications: item.maxApplications || 0,
      applicationCount: item.applicationCount || 0,
      maxApproved: item.maxApproved || 0,
      approvedCount: item.approvedCount || 0,
    });
  }

  return {
    code: "success",
    message: "Success.",
    jobList: dataFinal,
    totalPage,
    totalRecord,
    currentPage: page,
    pageSize: limitItems
  };
};

export const getCompanyJobEditService = async (
  jobId: string,
  companyId: Types.ObjectId
): Promise<{ status: number; code: string; message: string; jobDetail?: unknown }> => {
  if (!jobId || !/^[a-fA-F0-9]{24}$/.test(jobId)) {
    return { status: 404, code: "error", message: "Job not found." };
  }

  const jobDetail = await Job.findOne({
    _id: jobId,
    companyId
  }).select("title description address salaryMin salaryMax position workingForm locations skills keyword benefit requirement expirationDate maxApplications maxApproved images");

  if (!jobDetail) {
    return { status: 404, code: "error", message: "Job not found." };
  }

  return {
    status: 200,
    code: "success",
    message: "Success.",
    jobDetail: {
      ...jobDetail.toObject(),
      images: jobDetail.images || [],
    }
  };
};

export const editCompanyJobService = async (
  jobId: string,
  companyId: Types.ObjectId,
  input: EditCompanyJobDTO
): Promise<{ status: number; code: string; message: string }> => {
  const { files, ...body } = input;
  const cleanupNewFiles = () => {
    if (files && files.length > 0) {
      void deleteImages(files.map(f => f.path)).catch(() => {});
    }
  };

  if (!jobId || !/^[a-fA-F0-9]{24}$/.test(jobId)) {
    cleanupNewFiles();
    return { status: 400, code: "error", message: "Invalid job ID." };
  }

  const jobDetail = await Job.findOne({ _id: jobId, companyId }).select("title salaryMin salaryMax position workingForm skills locations description images maxApplications maxApproved expirationDate");
  if (!jobDetail) {
    cleanupNewFiles();
    return { status: 404, code: "error", message: "Job not found." };
  }

  const updateData: Partial<IJob> = {};

  if (body.title !== undefined) updateData.title = body.title;
  if (body.salaryMin !== undefined) updateData.salaryMin = parseInt(String(body.salaryMin)) || 0;
  if (body.salaryMax !== undefined) updateData.salaryMax = parseInt(String(body.salaryMax)) || 0;
  if (body.maxApplications !== undefined) updateData.maxApplications = parseInt(String(body.maxApplications)) || 0;
  if (body.maxApproved !== undefined) updateData.maxApproved = parseInt(String(body.maxApproved)) || 0;
  if (body.position !== undefined) updateData.position = body.position;
  if (body.workingForm !== undefined) updateData.workingForm = body.workingForm;
  if (body.description !== undefined) updateData.description = sanitizeRichText(body.description);

  if (body.expirationDate !== undefined) {
    if (body.expirationDate && body.expirationDate !== "") {
      updateData.expirationDate = new Date(body.expirationDate);
    } else {
      updateData.expirationDate = null;
    }
  }

  if (body.skills !== undefined) {
    updateData.skills = normalizeSkills(body.skills as string[]);
    if (!updateData.skills || updateData.skills.length === 0) {
      cleanupNewFiles();
      return { status: 400, code: "error", message: "Please provide at least one valid skill for the job." };
    }
  }

  if (body.locations !== undefined) {
    if (typeof body.locations === "string") {
      try {
        const parsed = JSON.parse(body.locations) as string[];
        updateData.locations = parsed.map(id => new Types.ObjectId(id));
      } catch {
        updateData.locations = [];
      }
    } else if (Array.isArray(body.locations)) {
      updateData.locations = (body.locations as string[]).map(id => new Types.ObjectId(id));
    }
  }

  const uniqueOrdered = (images: string[]) => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const img of images) {
      if (!seen.has(img)) {
        seen.add(img);
        result.push(img);
      }
    }
    return result;
  };

  const oldImages = (jobDetail.images || []) as string[];
  let mergedImages: string[] | null = null;
  if (body.imageOrder !== undefined || body.existingImages !== undefined || (files && files.length > 0)) {
    let existingImages: string[] = [];
    if (body.existingImages && typeof body.existingImages === "string") {
      try {
        const existing = JSON.parse(body.existingImages);
        if (Array.isArray(existing)) {
          existingImages = existing as string[];
        }
      } catch {
        existingImages = [];
      }
    }
    const newImages: string[] = files ? files.map(f => f.path) : [];

    if (body.imageOrder !== undefined) {
      try {
        const imageOrder = JSON.parse(body.imageOrder) as string[];
        if (Array.isArray(imageOrder)) {
          let newImageIndex = 0;
          const orderedMerge: string[] = [];
          for (const item of imageOrder) {
            if (item === "NEW_IMAGE") {
              if (newImageIndex < newImages.length) {
                orderedMerge.push(newImages[newImageIndex]);
                newImageIndex++;
              }
            } else if (typeof item === "string" && existingImages.includes(item)) {
              orderedMerge.push(item);
            }
          }
          mergedImages = uniqueOrdered(orderedMerge);
        } else {
          mergedImages = uniqueOrdered([...existingImages, ...newImages]);
        }
      } catch {
        mergedImages = uniqueOrdered([...existingImages, ...newImages]);
      }
    } else {
      mergedImages = uniqueOrdered([...existingImages, ...newImages]);
    }
  }

  if (mergedImages) {
    if (mergedImages.length === 0) {
      cleanupNewFiles();
      return { status: 400, code: "error", message: "Job must have at least 1 image." };
    }
    updateData.images = mergedImages;
  }

  if (updateData.title && updateData.title !== jobDetail.title) {
    updateData.slug = generateUniqueSlug(updateData.title, jobId);
  }

  await Job.updateOne({ _id: jobId, companyId }, updateData);

  if (mergedImages) {
    const removedImages = oldImages.filter(url => !mergedImages!.includes(url));
    void deleteImages(removedImages).catch((err) => console.error("[Cloudinary] Failed to delete:", err));
  }

  await invalidateJobDiscoveryCaches();
  return { status: 200, code: "success", message: "Update successful." };
};

export const deleteCompanyJobService = async (
  jobId: string,
  companyId: Types.ObjectId
): Promise<{ status: number; code: string; message: string }> => {
  if (!jobId || !/^[a-fA-F0-9]{24}$/.test(jobId)) {
    return { status: 400, code: "error", message: "Invalid job ID." };
  }

  const jobDetail = await Job.findOne({ _id: jobId, companyId }).select("images");
  if (!jobDetail) {
    return { status: 404, code: "error", message: "Job not found." };
  }

  if (jobDetail.images && Array.isArray(jobDetail.images)) {
    void deleteImages(jobDetail.images).catch((err) => console.error("[Cloudinary] Failed to delete:", err));
  }

  const cvList = await CV.find({ jobId: new Types.ObjectId(jobId) }).select("fileCV").lean<Pick<ICV, "fileCV">[]>();
  const cvFiles = cvList.map(cv => cv.fileCV).filter(Boolean);
  void deleteImages(cvFiles).catch((err) => console.error("[Cloudinary] Failed to delete:", err));
  await CV.deleteMany({ jobId: new Types.ObjectId(jobId) });

  await JobView.deleteMany({ jobId: new Types.ObjectId(jobId) });
  await SavedJob.deleteMany({ jobId: new Types.ObjectId(jobId) });
  await Job.deleteOne({ _id: jobId, companyId });
  await Notification.deleteMany({ "data.jobId": new Types.ObjectId(jobId) });

  await invalidateJobDiscoveryCaches();
  return { status: 200, code: "success", message: "Job deleted." };
};
