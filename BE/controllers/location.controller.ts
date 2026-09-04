import { Request, Response } from "express";
import * as locationService from "../services/location.service";

export const topLocations = async (_req: Request, res: Response): Promise<void> => {
  const result = await locationService.getTopLocations();
  res.json(result);
};

export const list = async (_req: Request, res: Response): Promise<void> => {
  const result = await locationService.getLocationList();
  res.json(result);
};
