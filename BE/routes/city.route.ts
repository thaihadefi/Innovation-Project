import { Router } from "express";
import * as cityController from "../controllers/city.controller";

const router = Router();

router.get('/top-cities', cityController.topCities);
router.get('/', cityController.list);
router.get('/list', cityController.list);

export default router;