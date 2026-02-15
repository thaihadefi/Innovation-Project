export const positionList = [
  {
    label: "Intern",
    value: "intern"
  },
  {
    label: "Fresher",
    value: "fresher"
  },
  {
    label: "Junior",
    value: "junior"
  },
  {
    label: "Middle",
    value: "middle"
  },
  {
    label: "Senior",
    value: "senior"
  },
  {
    label: "Manager",
    value: "manager"
  },
];

export const workingFormList = [
  {
    label: "On-site",
    value: "office"
  },
  {
    label: "Remote",
    value: "remote"
  },
  {
    label: "Flexible",
    value: "flexible"
  },
]

export const cvStatusList = [
  {
    label: "Pending",
    value: "initial",
    color: "#121212"
  },
  {
    label: "Viewed",
    value: "viewed",
    color: "#0088FF"
  },
  {
    label: "Approved",
    value: "approved",
    color: "#47BE02"
  },
  {
    label: "Rejected",
    value: "rejected",
    color: "#FF5100"
  }
];

export const paginationConfig = {
  // Candidate pages
  candidateApplicationsList: 6,   // Submitted applications list
  
  // Company pages
  companyJobList: 6,              // Company's job postings list
  companyCVList: 6,               // Received applications list
  
  // Public pages
  searchResults: 9,               // Search results page
  companyDetailJobs: 9,           // Company detail jobs list
  companyList: 20,                // Company list page
  homeTopCompanies: 6,            // Homepage top companies fetch size
  homeTopEmployers: 12,           // Homepage top employers section
  analyticsTopJobs: 10,           // Company analytics: top jobs in chart
  interviewTipsRoot: 8,           // Interview tips root tracks per page
  
  // Top list limits
  topSkills: 5,                   // Generic top skills count
  navbarTopSkills: 5,             // Top skills in IT Jobs dropdown
  navbarTopCompanies: 5,          // Top companies in dropdown
  navbarTopLocations: 5,             // Top locations in dropdown
  maxDisplayedJobLocations: 5,       // Location names shown in each job card
};

export const notificationConfig = {
  dropdownLimit: 5,     // Number shown in header dropdown
  pageSize: 10,         // Notifications per page on full page
};

export const followConfig = {
  pageSize: 9,          // Followed companies per page
};
