export const paginationConfig = {
  // Default page size for public search results
  searchResults: 9,

  // Server-side cap for page size to prevent large queries
  maxPageSize: 50,

  // Company pages
  companyJobList: 6,
  companyCVList: 6,
  companyReviews: 10,

  // Candidate pages
  candidateApplicationsList: 6,
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
// Industry standard: 100-1000 requests/15min for general APIs
export const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  general: {
    // 500 requests/15min = ~33 requests/min per IP (sufficient for normal browsing)
    max: process.env.NODE_ENV === "production" ? 500 : 10000,
  },
  auth: {
    // 10 login attempts/15min - prevent brute force but allow typos
    max: process.env.NODE_ENV === "production" ? 10 : 10000,
  },
};
