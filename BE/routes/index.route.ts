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

export default router;
