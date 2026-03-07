export type InterviewPreparationSection = {
  key: string;
  badge: string;
  title: string;
  href: string;
  description: string;
  children: { title: string; href: string }[];
};

export const interviewPreparationSections: InterviewPreparationSection[] = [
  {
    key: "experiences",
    badge: "Community",
    title: "Interview Experiences",
    href: "/candidate-manage/interview-preparation/experiences",
    description: "Real interview stories shared by UIT students and alumni. Learn what to expect.",
    children: [
      { title: "Browse experiences", href: "/candidate-manage/interview-preparation/experiences" },
      { title: "Share your experience", href: "/candidate-manage/interview-preparation/experiences/create" },
    ],
  },
  {
    key: "dsa",
    badge: "DSA",
    title: "Data Structures and Algorithms",
    href: "/candidate-manage/interview-preparation/dsa",
    description: "Code templates, interview stages, and cheatsheets for DSA preparation.",
    children: [
      { title: "Code templates", href: "/candidate-manage/interview-preparation/dsa/code-templates" },
      { title: "Stages of an interview", href: "/candidate-manage/interview-preparation/dsa/stages-of-an-interview" },
      { title: "Cheatsheets", href: "/candidate-manage/interview-preparation/dsa/cheatsheets" },
      { title: "Practice resources", href: "/candidate-manage/interview-preparation/dsa/practice-resources" },
    ],
  },
];

// Alias
export const interviewPrepSections = interviewPreparationSections;
