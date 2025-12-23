import { Router } from "express";
import * as searchController from "../controllers/search.controller";

const router = Router();

router.get("/", searchController.search);

export default router;