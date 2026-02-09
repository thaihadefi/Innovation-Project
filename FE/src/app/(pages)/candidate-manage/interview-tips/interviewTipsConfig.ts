export type InterviewTipsSection = {
  key: string;
  badge: string;
  title: string;
  href: string;
  description: string;
  children: { title: string; href: string }[];
};

export const interviewTipsSections: InterviewTipsSection[] = [
  {
    key: "dsa",
    badge: "DSA",
    title: "Data Structures and Algorithms",
    href: "/candidate-manage/interview-tips/dsa",
    description: "Code templates, interview stages, and cheatsheets for DSA preparation.",
    children: [
      { title: "Code templates", href: "/candidate-manage/interview-tips/dsa/code-templates" },
      { title: "Stages of an interview", href: "/candidate-manage/interview-tips/dsa/stages-of-an-interview" },
      { title: "Cheatsheets", href: "/candidate-manage/interview-tips/dsa/cheatsheets" },
    ],
  },
];
