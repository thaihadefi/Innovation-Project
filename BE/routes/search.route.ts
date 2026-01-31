import { Router } from "express";
import * as searchController from "../controllers/search.controller";
import { searchLimiter } from "../middlewares/rate-limit.middleware";

const router = Router();

router.get("/", searchLimiter, searchController.search);

export default router;
