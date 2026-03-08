export type FAQItem = {
  question: string;
  answer: string;
};

export type FAQCategory = {
  category: string;
  items: FAQItem[];
};

export const faqData: FAQCategory[] = [
  {
    category: "General",
    items: [
      {
        question: "What is UITJobs?",
        answer:
          "UITJobs is an IT job portal built exclusively for students and alumni of UIT-VNUHCM. It connects UIT-ers with tech companies looking for IT talent in Vietnam and abroad.",
      },
      {
        question: "Who can use UITJobs?",
        answer:
          "UITJobs is open to UIT students, alumni, and IT companies. Candidates register with an email; optional student verification unlocks exclusive features.",
      },
      {
        question: "Is UITJobs free to use?",
        answer:
          "Yes. UITJobs is completely free for candidates. Companies can register and post job listings at no cost.",
      },
      {
        question: "How do I search for jobs?",
        answer:
          "Use the search bar on the homepage or go to the Browse Jobs page. Filter by keyword, job type, location, skill, salary range, and more.",
      },
      {
        question: "What is the Salary Insights page?",
        answer:
          "Salary Insights shows average, minimum, and maximum salary data for IT roles broken down by position, skill, and location. No login required.",
      },
      {
        question: "What do the company badges mean?",
        answer:
          "Companies earn badges automatically based on performance. Four badges are available: Top Rated (rating >= 4.5 with 3+ reviews), Active Recruiter (10+ approved applications), Trusted Employer (15+ reviews), and Hot Jobs (5+ active positions). Badges appear on company cards and profiles.",
      },
    ],
  },
  {
    category: "For Candidates",
    items: [
      {
        question: "How do I create a candidate account?",
        answer:
          "Click \"Sign Up\" on the homepage, enter your email and password, then verify via the OTP sent to your inbox. Once verified, you can complete your profile.",
      },
      {
        question: "Can I update my profile?",
        answer:
          "Yes. Go to \"Profile\" in your dashboard to update your phone, skills, and photo. Before verification, you can also edit your name, student ID, cohort, and major (these lock once admin-approved). Email is changed separately via OTP verification.",
      },
      {
        question: "What is student verification and why do I need it?",
        answer:
          "Student verification confirms you are a current UIT student or alumnus by submitting your full name, student ID, cohort, and major. Once an admin approves, you can apply for jobs, access Interview Preparation, and write company reviews.",
      },
      {
        question: "How do I apply for a job?",
        answer:
          "Open a job listing and click \"Apply Now\". Upload your CV as a PDF and submit. Each job allows one application per candidate. Track all submissions under \"My Applications\" in your dashboard.",
      },
      {
        question: "Can I update or withdraw a job application?",
        answer:
          "Yes. From \"My Applications\", you can re-upload your CV while the application is still Pending and the job has not expired. You can also withdraw any application at any time. This cannot be undone.",
      },
      {
        question: "Can I save jobs to apply later?",
        answer:
          "Yes. Click the bookmark icon on any job card to save it. Access saved jobs from \"Saved Jobs\" in your dashboard.",
      },
      {
        question: "Can I follow companies?",
        answer:
          "Yes. Click the follow button on any company profile. Manage followed companies from \"Followed Companies\" in your dashboard.",
      },
      {
        question: "How do job recommendations work?",
        answer:
          "UITJobs recommends jobs based on your profile, saved jobs, and activity. The more complete your profile, the better the recommendations. View them under \"Recommended Jobs\" in your dashboard.",
      },
      {
        question: "Can I write, edit, or delete a company review?",
        answer:
          "Yes. Verified UIT students and alumni can rate companies on salary, work-life balance, career growth, culture, and management. Reviews can be anonymous. One review per company. Open it from the company's profile page to edit or delete. Edited reviews are tagged with an \"(edited)\" label.",
      },
      {
        question: "What is the Interview Preparation section?",
        answer:
          "Interview Preparation is exclusive to verified UIT students and alumni. Currently featuring curated DSA resources (cheatsheets, code templates, and practice guides) with more topics on the way: system design, CS fundamentals, behavioral, and beyond. Plus a community board of real interview stories from UIT candidates, tagged by result and difficulty. Get verified to access it.",
      },
      {
        question: "Can I post, edit, or delete an interview experience?",
        answer:
          "Yes. From the interview experience board, click \"Share Your Experience\" to write a new post. Include the company, position, result, difficulty, and your story. Posts can be shared anonymously. You can edit or delete your own posts and comments at any time. Edited content is tagged with an \"(edited)\" label.",
      },
      {
        question: "How do I track my application status?",
        answer:
          "Go to \"My Applications\" in your dashboard. Each application shows its status: Pending, Approved, or Rejected. You will be notified when a company updates your status.",
      },
      {
        question: "Can I report inappropriate content?",
        answer:
          "Yes. Click the flag icon on any review or interview experience comment to report it. Provide a reason and our admin team will review it.",
      },
    ],
  },
  {
    category: "For Companies",
    items: [
      {
        question: "How do I register my company?",
        answer:
          "Before registering, your company must contact UIT's Office of Student Affairs at ctsv@uit.edu.vn to be verified as an eligible employer. Once confirmed, click \"For Employers\" > \"Register\", fill in your details, and submit. An admin will approve your account and you will receive an email notification.",
      },
      {
        question: "Can I update my company profile?",
        answer:
          "Yes. Go to \"Profile\" in your dashboard to update your logo, description, location, and other company details. Your company name is locked after registration. Email is changed separately via OTP verification.",
      },
      {
        question: "How do I manage job listings?",
        answer:
          "Go to \"Manage Jobs\" in your dashboard. Click \"Post a Job\" to create a new listing with title, description, skills, salary, and deadline. To update or remove an existing listing, use the Edit or Delete options. Deleting a job is permanent and removes all associated applications.",
      },
      {
        question: "How do I review applications?",
        answer:
          "Go to \"Applications\" in your dashboard. Open a CV to view the full application and candidate contact info (email and phone). Approve, reject, or permanently delete applications from that page.",
      },
      {
        question: "How do notifications work for companies?",
        answer:
          "Your company receives notifications when candidates apply and for other platform activity. Access them via the bell icon and mark as read individually or all at once.",
      },
      {
        question: "What analytics does UITJobs provide for companies?",
        answer:
          "The Analytics dashboard shows job performance data (view counts, application trends) to help you understand how your listings are performing.",
      },
    ],
  },
  {
    category: "Account & Security",
    items: [
      {
        question: "I forgot my password. How do I reset it?",
        answer:
          "Click \"Forgot Password\" on the login page, enter your email, verify via OTP, then set a new password.",
      },
      {
        question: "How do I change my email address?",
        answer:
          "Go to your profile settings and click \"Change Email\". Verify the new email via OTP. You will be logged out automatically and must sign in with the new email.",
      },
      {
        question: "Is my personal data safe?",
        answer:
          "Yes. All passwords are hashed and never stored in plain text. Authentication uses HTTP-only secure cookies. Your data is never shared with third parties without your consent.",
      },
    ],
  },
];
