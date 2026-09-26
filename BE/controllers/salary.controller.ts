import { Request, Response } from "express";
import * as salaryService from "../services/salary.service";

export const getSalaryInsights = async (_req: Request, res: Response): Promise<void> => {
  const result = await salaryService.fetchSalaryInsights();
  res.json(result);
};
