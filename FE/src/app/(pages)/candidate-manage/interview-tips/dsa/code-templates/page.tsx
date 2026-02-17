import { cookies } from "next/headers";
import { CodeTemplatesClient } from "./CodeTemplatesClient";

export default async function CodeTemplatesPage() {
  const cookieStore = await cookies();
  const initialTab = cookieStore.get("interview_tips_code_tab")?.value;

  return <CodeTemplatesClient initialTab={initialTab as "C++" | "Python3" | undefined} />;
}
