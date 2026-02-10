import { Router } from "express";
import candidateRoutes from "./candidate.route";
import authRoutes from "./auth.route";
import companyRoutes from "./company.route";
import cityRoutes from "./city.route";
import searchRoutes from "./search.route";
import jobRoutes from "./job.route";
import salaryRoutes from "./salary.route";
import reviewRoutes from "./review.route";

const router = Router();

router.use('/candidate', candidateRoutes);

router.use('/auth', authRoutes);

router.use('/company', companyRoutes);

router.use('/city', cityRoutes);

router.use('/search', searchRoutes);

router.use('/job', jobRoutes);

router.use('/salary', salaryRoutes);

router.use('/review', reviewRoutes);

export default router;
