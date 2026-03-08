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
          "UITJobs is open to all UIT students, alumni, and IT companies. Candidates must register with a valid email and optionally complete student verification to unlock exclusive features.",
      },
      {
        question: "Is UITJobs free to use?",
        answer:
          "Yes. UITJobs is completely free for candidates. Companies can register and post job listings at no cost.",
      },
      {
        question: "How do I search for jobs?",
        answer:
          "Use the search bar on the homepage or go to the Browse Jobs page. You can filter by keyword, job type, location, skill, salary range, and more. Results update as you adjust filters.",
      },
      {
        question: "What is the Salary Insights page?",
        answer:
          "Salary Insights is a public page that shows average, minimum, and maximum salary data for IT roles on UITJobs — broken down by position, skill, and location. No login is required to view it.",
      },
    ],
  },
  {
    category: "For Candidates",
    items: [
      {
        question: "How do I create a candidate account?",
        answer:
          "Click \"Sign Up\" on the homepage, fill in your email and password, then verify your email via the OTP sent to your inbox. Once verified, you can complete your profile.",
      },
      {
        question: "Can I update my profile?",
        answer:
          "Yes. Go to \"Profile\" in your dashboard to update your phone number, skills, and profile photo at any time. If you have not yet been verified as a UIT student, you can also update your name, student ID, cohort, and major. Once admin verification is approved, those identity fields become locked. To change your email, use the \"Change Email\" option which requires OTP verification.",
      },
      {
        question: "What is student verification and why do I need it?",
        answer:
          "Student verification confirms you are a current UIT student or alumnus. You need to provide your full name, student ID, cohort, and major. Once an admin approves your information, you gain access to exclusive features like Interview Preparation and the ability to write company reviews.",
      },
      {
        question: "How do I apply for a job?",
        answer:
          "Open any job listing and click \"Apply Now\". Upload your CV as a PDF file and submit. Each job allows one application per candidate. You can track all your submitted applications in the \"My Applications\" section.",
      },
      {
        question: "Can I update or withdraw a job application?",
        answer:
          "Yes. From \"My Applications\" in your dashboard, you can re-upload your CV for an application that is still Pending and the job has not yet expired. You can also withdraw (delete) any application at any time — this is permanent and cannot be undone.",
      },
      {
        question: "Can I save jobs to apply later?",
        answer:
          "Yes. Click the bookmark icon on any job card or listing page to save it. Access your saved jobs anytime from the \"Saved Jobs\" section in your dashboard.",
      },
      {
        question: "Can I follow companies?",
        answer:
          "Yes. Click the follow button on any company profile to follow them. You can manage all your followed companies from the \"Followed Companies\" section in your dashboard.",
      },
      {
        question: "How do job recommendations work?",
        answer:
          "UITJobs recommends jobs based on your profile, saved jobs, and activity. The more complete your profile is, the more relevant your recommendations will be. View them from the \"Recommended Jobs\" section in your dashboard.",
      },
      {
        question: "Can I write a review for a company?",
        answer:
          "Yes, verified UIT students and alumni can write reviews for companies on their profile page. You can rate the company on salary, work-life balance, career growth, culture, and management. Reviews can be posted anonymously. You can also mark other reviews as helpful.",
      },
      {
        question: "What is the Interview Preparation section?",
        answer:
          "Interview Preparation is an exclusive section for verified UIT students and alumni. It includes DSA cheatsheets, code templates, practice resources, and a community-driven interview experience board where you can read and share real interview stories.",
      },
      {
        question: "Can I edit or delete my interview experience post?",
        answer:
          "Yes. You can edit or delete any interview experience post you have written. Open the post and use the edit or delete options available to the author. You can also edit or delete your own comments and replies on any interview experience post — edited comments are tagged with an \"(edited)\" label. You can also mark any post as helpful using the Helpful button on the post detail page.",
      },
      {
        question: "Can I edit or delete my company review?",
        answer:
          "Yes. You can edit or delete a review you have written by opening it from the company's profile page and selecting the edit or delete option.",
      },
      {
        question: "How do I track my application status?",
        answer:
          "Go to \"My Applications\" in your dashboard. Each application shows its current status: Pending (awaiting review), Approved, or Rejected. You will also receive a notification when the company updates your application status.",
      },
      {
        question: "How do notifications work?",
        answer:
          "UITJobs sends you notifications for key events such as application status updates and other platform activity. Access your notifications via the bell icon in the header. You can mark individual notifications as read or clear them all at once.",
      },
      {
        question: "Can I report inappropriate content?",
        answer:
          "Yes. You can report reviews and interview experience comments that violate community guidelines. Click the flag icon on the content you want to report and provide a reason. Reports are reviewed by our admin team.",
      },
    ],
  },
  {
    category: "For Companies",
    items: [
      {
        question: "How do I register my company?",
        answer:
          "Before registering, your company must contact UIT's Office of Student Affairs at ctsv@uit.edu.vn to be verified as an eligible employer. Once CTSV confirms your company's information, you can click \"For Employers\" → \"Register\", fill in your details, and submit. An admin will then approve your account and you will receive an email notification.",
      },
      {
        question: "Can I update my company profile?",
        answer:
          "Yes. Go to \"Profile\" in your dashboard to update your company logo, description, location, address, company model, size, working hours, and phone number. Your company name is locked after registration. To change your email, use the \"Change Email\" option which requires OTP verification.",
      },
      {
        question: "How do I post a job listing?",
        answer:
          "After your company is approved, go to \"Manage Jobs\" in your dashboard and click \"Post a Job\". Fill in the job details including title, description, skills, salary, and deadline, then submit for publishing.",
      },
      {
        question: "How do I review applications?",
        answer:
          "Go to \"Applications\" in your dashboard to see all CVs submitted for your jobs. Open a CV to view the candidate's full application along with their contact information (email and phone). You can then approve or reject the application directly from that page.",
      },
      {
        question: "Can I edit or delete a job listing?",
        answer:
          "Yes. Go to \"Manage Jobs\" in your dashboard, find the listing, and click Edit to update it or Delete to remove it. Deleting a job listing is permanent and will also remove all associated applications.",
      },
      {
        question: "How do notifications work for companies?",
        answer:
          "Your company receives notifications when candidates apply to your jobs and for other platform activity. Access them via the bell icon in the header and mark them as read individually or all at once.",
      },
      {
        question: "What analytics does UITJobs provide for companies?",
        answer:
          "Companies have access to an Analytics dashboard showing job performance data such as view counts and application trends, helping you understand how your listings are performing.",
      },
    ],
  },
  {
    category: "Account & Security",
    items: [
      {
        question: "I forgot my password. How do I reset it?",
        answer:
          "Click \"Forgot Password\" on the login page and enter your registered email. You will receive an OTP to verify your identity, after which you can set a new password.",
      },
      {
        question: "How do I change my email address?",
        answer:
          "Go to your profile settings and click \"Change Email\". You will need to verify the new email via OTP before the change takes effect. You will be logged out automatically and must log in again with the new email.",
      },
      {
        question: "Is my personal data safe?",
        answer:
          "Yes. All passwords are hashed and never stored in plain text. Authentication uses HTTP-only secure cookies. Your data is never shared with third parties without your consent.",
      },
    ],
  },
];
