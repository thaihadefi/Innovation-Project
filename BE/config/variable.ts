export const paginationConfig = {
  searchResults: 9,
  companyDetailJobs: 9,
  companyList: 12,
  savedJobsList: 10,
  candidateFollowedCompanies: 9,
  notificationsPageSize: 10,

  maxPageSize: 50,
  maxCompanyDetailJobPageSize: 30,

  companyJobList: 6,
  companyCVList: 6,
  companyReviews: 10,

  candidateApplicationsList: 6,

  experiencesList: 10,
  experienceComments: 20,
};

export const discoveryConfig = {
  topSkills: 5,
  topLocations: 5,
  topCompanies: 5,
  candidateRecommendationLimit: 10,
  candidateRecommendationBasedOnLimit: 5,
};

export const salaryInsightsConfig = {
  topSkills: 15,
  topLocations: 10,
};

export const searchScanLimits = {
  jobKeywordAtlas: 5000,
  companyKeywordAtlas: 2000,
  jobMongoScan: 5000,
  jobRecommendationScan: 500,
};

export const notificationConfig = {
  maxStored: 50,
  dropdownLimit: 5,
};

export const positionList = [
  { label: "Intern", value: "intern" },
  { label: "Fresher", value: "fresher" },
  { label: "Junior", value: "junior" },
  { label: "Middle", value: "middle" },
  { label: "Senior", value: "senior" },
  { label: "Manager", value: "manager" },
  { label: "Leader", value: "leader" },
  { label: "All Levels", value: "all" },
];

export const adminPaginationConfig = {
  candidates: 20,
  companies: 20,
  jobs: 20,
  accounts: 20,
  roles: 20,
  experiences: 10,
  reports: 10,
  auditLogs: 20,
};

export const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  general: {
    max: process.env.NODE_ENV === "production" ? 1000 : 10000,
  },
  login: {
    max: process.env.NODE_ENV === "production" ? 20 : 10000,
  },
  apply: {
    max: process.env.NODE_ENV === "production" ? 30 : 10000,
  },
  search: {
    max: process.env.NODE_ENV === "production" ? 120 : 10000,
  },
  socketAuth: {
    maxPerMinute: process.env.NODE_ENV === "production" ? 60 : 10000,
  },
  forgotPassword: {
    max: process.env.NODE_ENV === "production" ? 5 : 10000,
  },
  otpVerify: {
    max: process.env.NODE_ENV === "production" ? 10 : 10000,
  },
  emailChangeRequest: {
    max: process.env.NODE_ENV === "production" ? 5 : 10000,
  },
  emailChangeOtp: {
    max: process.env.NODE_ENV === "production" ? 10 : 10000,
  },
};
