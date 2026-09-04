import { Response, Request } from "express";
import { serverError } from "../helpers/response.helper";
import * as salaryService from "../services/salary.service";

export const getSalaryInsights = async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await salaryService.fetchSalaryInsights();
    res.json(data);
  } catch (error) {
    console.error("Salary insights error:", error);
    serverError(res, "Failed to get salary insights");
  }
};
