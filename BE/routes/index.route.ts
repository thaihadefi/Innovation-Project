import { Router } from "express";
import candidateRoutes from "./candidate.route";
import authRoutes from "./auth.route";
import companyRoutes from "./company.route";
import locationRoutes from "./location.route";
import searchRoutes from "./search.route";
import jobRoutes from "./job.route";
import salaryRoutes from "./salary.route";
import reviewRoutes from "./review.route";
import adminRoutes from "./admin.route";
import interviewExperienceRoutes from "./interview-experience.route";

const router = Router();

router.use('/admin', adminRoutes);

router.use('/candidate', candidateRoutes);

router.use('/auth', authRoutes);

router.use('/company', companyRoutes);

router.use('/location', locationRoutes);

router.use('/search', searchRoutes);

router.use('/job', jobRoutes);

router.use('/salary', salaryRoutes);

router.use('/review', reviewRoutes);
router.use('/interview-experiences', interviewExperienceRoutes);

// Debug environment and URLs
router.get('/debug-env', (req, res) => {
  const getFrontendUrl = () => (process.env.FRONTEND_URL || process.env.DOMAIN_FRONTEND || "http://localhost:3069").replace(/\/$/, "");
  res.json({
    env: {
      FRONTEND_URL: process.env.FRONTEND_URL || "NOT_SET",
      DOMAIN_FRONTEND: process.env.DOMAIN_FRONTEND || "NOT_SET",
      NODE_ENV: process.env.NODE_ENV || "NOT_SET"
    },
    generatedUrls: {
      base: getFrontendUrl(),
      dashboard: `${getFrontendUrl()}/company-manage/profile`,
      test_link: `${getFrontendUrl()}/some-test-path`
    }
  });
});

export default router;
