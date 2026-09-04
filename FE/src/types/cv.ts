/** Candidate CV / application detail shown on the CV edit & view pages. */
export type CvDetail = {
  _id?: string;
  jobSlug?: string;
  jobTitle?: string;
  status?: string;
  isExpired?: boolean;
  fullName?: string;
  email?: string;
  phone?: string;
  fileCV?: string;
  isVerified?: boolean;
  createdAt?: string;
};
