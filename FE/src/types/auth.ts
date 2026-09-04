export type CandidateInfo = {
  _id?: string;
  id?: string;
  fullName?: string;
  email?: string;
  avatar?: string | null;
  phone?: string;
  studentId?: string;
  major?: string;
  cohort?: string;
  skills?: string[];
  isVerified?: boolean;
  [key: string]: unknown;
};

export type CompanyInfo = {
  _id?: string;
  id?: string;
  companyName?: string;
  logo?: string | null;
  email?: string;
  phone?: string;
  location?: string;
  address?: string;
  companyModel?: string;
  companyEmployees?: string;
  workingTime?: string;
  workOverTime?: string;
  description?: string;
  [key: string]: unknown;
};

export type ServerAuth = {
  infoCandidate: CandidateInfo | null;
  infoCompany: CompanyInfo | null;
  candidateUnreadCount?: number;
  companyUnreadCount?: number;
} | null;
