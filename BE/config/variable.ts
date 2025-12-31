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
