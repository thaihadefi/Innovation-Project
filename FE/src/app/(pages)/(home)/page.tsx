import { Section1 } from "@/app/components/section/Section1";
import { Section2 } from "./Section2";
import { RecommendedJobs } from "./RecommendedJobs";

export default function HomePage() {
  return (
    <>
      {/* Section 1 */}
      <Section1 />
      {/* End Section 1 */}

      {/* Recommended Jobs - Shows only for logged-in candidates */}
      <RecommendedJobs />
      {/* End Recommended Jobs */}

      {/* Section 2 */}
      <Section2 />
      {/* End Section 2 */}
    </>
  );
}
