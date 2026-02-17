import { Router } from "express";
import * as locationController from "../controllers/location.controller";

const router = Router();

router.get('/top-locations', locationController.topLocations);
router.get('/', locationController.list);
router.get('/list', locationController.list);

export default router;
