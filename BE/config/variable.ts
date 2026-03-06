export const paginationConfig = {
  // Default page size for public search results
  searchResults: 9,
  companyDetailJobs: 9,
  companyList: 12,
  savedJobsList: 10,
  candidateFollowedCompanies: 9,
  notificationsPageSize: 10,

  // Server-side cap for page size to prevent large queries
  maxPageSize: 50,
  maxCompanyDetailJobPageSize: 30,

  // Company pages
  companyJobList: 6,
  companyCVList: 6,
  companyReviews: 10,

  // Candidate pages
  candidateApplicationsList: 6,
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

export const notificationConfig = {
  maxStored: 50,        // Maximum notifications stored per user in DB (TTL handles cleanup)
  dropdownLimit: 5,     // Number shown in header dropdown 
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

// Rate limiting config - adjust for production
// Generous limits while preventing abuse/DDoS
export const adminPaginationConfig = {
  candidates: 20,
  companies: 20,
  jobs: 20,
  accounts: 20,
};

export const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  general: {
    // 1000 requests/15min = ~67 req/min per IP (very generous for normal use)
    // Prevents DDoS but allows heavy browsing, pagination, API calls
    max: process.env.NODE_ENV === "production" ? 1000 : 10000,
  },
  login: {
    // 20 login attempts/15min (candidate/company)
    max: process.env.NODE_ENV === "production" ? 20 : 10000,
  },
  apply: {
    // 30 apply attempts/15min
    max: process.env.NODE_ENV === "production" ? 30 : 10000,
  },
  search: {
    // 120 search requests/15min
    max: process.env.NODE_ENV === "production" ? 120 : 10000,
  },
  socketAuth: {
    // Socket handshake auth attempts per minute per IP
    maxPerMinute: process.env.NODE_ENV === "production" ? 60 : 10000,
  },
  forgotPassword: {
    // 5 forgot-password requests/15min per IP — prevents email spam to victims
    max: process.env.NODE_ENV === "production" ? 5 : 10000,
  },
  otpVerify: {
    // 10 OTP verify attempts/15min per IP — prevents brute force on 6-digit OTP
    max: process.env.NODE_ENV === "production" ? 10 : 10000,
  },
  emailChangeRequest: {
    // 5 email-change requests/15min per IP — same budget as forgot-password (sends 2 emails per call)
    max: process.env.NODE_ENV === "production" ? 5 : 10000,
  },
  emailChangeOtp: {
    // 10 email-change OTP verify attempts/15min per IP — independent budget from password-reset OTP
    max: process.env.NODE_ENV === "production" ? 10 : 10000,
  },
};
