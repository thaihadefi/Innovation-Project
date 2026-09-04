/** Shape consumed by job cards / job lists across the public site. */
export type JobCard = {
  _id?: string;
  id?: string;
  slug?: string;
  title?: string;
  position?: string;
  workingForm?: string;
  companyId?: string;
  companyName?: string;
  companyLogo?: string;
  companyLocation?: string;
  salaryMin?: number;
  salaryMax?: number;
  jobLocations?: string[];
  skills?: string[];
  createdAt?: string;
  expirationDate?: string | null;
  isExpired?: boolean;
  isFull?: boolean;
  maxApproved?: number;
  approvedCount?: number;
  maxApplications?: number;
  applicationCount?: number;
};
