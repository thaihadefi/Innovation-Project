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
  homeTopEmployers: 12,           // Homepage top employers section
  
  // Navbar dropdown limits
  navbarTopSkills: 5,             // Top skills in IT Jobs dropdown
  navbarTopCompanies: 5,          // Top companies in dropdown
  navbarTopCities: 5,             // Top cities in dropdown
};