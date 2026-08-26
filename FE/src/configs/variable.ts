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
  candidateApplicationsList: 6,
  
  companyJobList: 6,
  companyCVList: 6,
  
  searchResults: 9,
  companyDetailJobs: 9,
  companyList: 20,
  homeTopCompanies: 6,
  homeTopEmployers: 12,
  analyticsTopJobs: 10,
  interviewPrepRoot: 8,
  
  topSkills: 5,
  navbarTopSkills: 5,
  navbarTopCompanies: 5,
  navbarTopLocations: 5,
  maxDisplayedJobLocations: 5,
};

export const notificationConfig = {
  dropdownLimit: 5,
  pageSize: 10,
};

export const followConfig = {
  pageSize: 9,
};

type StatusBadgeConfig = Record<string, { label: string; className: string }>;

export const accountStatusConfig: StatusBadgeConfig = {
  initial: { label: "Pending", className: "bg-yellow-50 text-yellow-700 border border-yellow-200" },
  active: { label: "Active", className: "bg-green-50 text-green-700 border border-green-200" },
  inactive: { label: "Inactive", className: "bg-red-50 text-red-600 border border-red-200" },
};

export const moderationStatusConfig: StatusBadgeConfig = {
  pending: { label: "Pending", className: "bg-yellow-50 text-yellow-700 border border-yellow-200" },
  approved: { label: "Approved", className: "bg-green-50 text-green-700 border border-green-200" },
  rejected: { label: "Rejected", className: "bg-red-50 text-red-600 border border-red-200" },
};

export const reportStatusConfig: StatusBadgeConfig = {
  pending: { label: "Pending", className: "bg-yellow-50 text-yellow-700 border border-yellow-200" },
  resolved: { label: "Resolved", className: "bg-green-50 text-green-700 border border-green-200" },
  dismissed: { label: "Dismissed", className: "bg-gray-50 text-gray-600 border border-gray-200" },
};
