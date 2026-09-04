import { Request, Response } from "express";
import { serverError, badRequest } from "../helpers/response.helper";
import * as searchService from "../services/search.service";

export const search = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await searchService.executeJobSearch(req.query);

    if (result.error) {
      badRequest(res, result.error);
      return;
    }

    res.json(result.data);
  } catch {
    serverError(res);
  }
};
