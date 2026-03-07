import { Metadata } from "next";
import { CreateExperienceClient } from "./CreateExperienceClient";

export const metadata: Metadata = { title: "Share Interview Experience" };

export default function CreateExperiencePage() {
  return <CreateExperienceClient />;
}
