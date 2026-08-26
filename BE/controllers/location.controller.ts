import { Request, Response } from "express";
import { serverError } from "../helpers/response.helper";
import * as locationService from "../services/location.service";

export const topLocations = async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await locationService.getTopLocations();
    res.json(data);
  } catch {
    serverError(res, "Failed to fetch top locations");
  }
};

export const list = async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await locationService.getLocationList();
    res.json(data);
  } catch {
    serverError(res, "Failed to fetch locations.");
  }
};
