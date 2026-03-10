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
          "Yes, UITJobs is 100% free. Candidates can browse and apply for jobs without any fees, while companies can register and post openings at no cost.",
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
          "Student verification is what separates full UITJobs members from guests. Submit your full name, student ID, cohort, and major for admin review. Once approved, you can apply for jobs, access Interview Preparation, and unlock every new feature we build for the UIT community going forward.",
      },
      {
        question: "How do I manage my job applications (apply, track, update, withdraw)?",
        answer:
          "To apply, submit your PDF CV on any job listing. Track submissions under \"My Applications\" to see real-time statuses (Pending, Viewed, Approved, Rejected). You can re-upload your CV as long as it's still Pending (not yet viewed by the company). You can also withdraw your application at any time (this cannot be undone).",
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
        question: "How do company reviews work?",
        answer:
          "Verified UIT members can submit one review per company to rate factors like salary, culture, and management. You can post anonymously, and you are free to edit or delete your review at any time from the company's profile page.",
      },
      {
        question: "What is the Interview Preparation section and how do I share my experience?",
        answer:
          "Exclusive to verified UIT students and alumni, this section currently features a community board of real interview stories and curated DSA resources (code templates, stages of an interview, cheatsheets, and practice resources). We are actively expanding to include system design, CS fundamentals, behavioral questions, and beyond. You can also help the community by sharing your own interview experiences (anonymously if you prefer). Get verified to unlock everything!",
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
        question: "What do the job application limits (Max Applications / Max Approved / Expiration Date) mean?",
        answer:
          "When posting a job, you can set optional limits to control candidate flow. \"Max Applications\" is the maximum number of total CVs the job can receive. \"Max Approved\" is the maximum number of candidates you are allowed to approve. \"Expiration Date\" is the specific date and time when the job listing will automatically stop accepting new applications and expire. Setting any numerical value to \"0\" or leaving the date blank means there is no limit for that specific field.",
      },
      {
        question: "How do I review applications?",
        answer:
          "Go to \"Applications\" in your dashboard. Open a CV to view the full application and candidate contact info (email and phone). Approve, reject, or permanently delete applications from that page.",
      },
      {
        question: "How do company notifications work?",
        answer:
          "You receive email alerts for new job applications, and in-app notifications (via the bell icon) for all other platform activities.",
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
