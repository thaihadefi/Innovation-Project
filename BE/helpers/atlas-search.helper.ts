import { FilterQuery, Model } from "mongoose";
import { decodeQueryValue } from "./query.helper";

const ATLAS_SEARCH_INDEX = process.env.ATLAS_SEARCH_INDEX || "default";

const isAtlasSearchUnavailableError = (error: unknown): boolean => {
  const message = String((error as any)?.message || "").toLowerCase();
  return (
    message.includes("unrecognized pipeline stage name: '$search'") ||
    message.includes("unknown pipeline stage name: '$search'") ||
    message.includes("atlas search") ||
    message.includes("search index") ||
    message.includes("is not allowed in this atlas tier")
  );
};

type FindIdsByKeywordParams<T> = {
  model: Model<T>;
  keyword: unknown;
  atlasPaths: string | string[];
  atlasMatch?: FilterQuery<T>;
  limit?: number;
};

export const findIdsByKeyword = async <T>({
  model,
  keyword,
  atlasPaths,
  atlasMatch,
  limit = 2000,
}: FindIdsByKeywordParams<T>): Promise<string[]> => {
  const normalizedKeyword = decodeQueryValue(keyword);
  if (!normalizedKeyword) return [];
  // Reject symbol-only inputs (no letters/digits) to avoid wasted Atlas roundtrips
  if (!/[\p{L}\p{N}]/u.test(normalizedKeyword)) return [];

  const pipeline: any[] = [
    {
      $search: {
        index: ATLAS_SEARCH_INDEX,
        text: {
          query: normalizedKeyword,
          path: atlasPaths,
        },
      },
    },
  ];

  if (atlasMatch && Object.keys(atlasMatch).length > 0) {
    pipeline.push({ $match: atlasMatch });
  }

  pipeline.push({ $project: { _id: 1 } }, { $limit: limit });

  try {
    const results = await model.aggregate(pipeline);
    return results.map((item: any) => item._id?.toString()).filter(Boolean);
  } catch (error) {
    if (isAtlasSearchUnavailableError(error)) {
      throw new Error("Atlas Search is unavailable. Please verify Atlas tier and search indexes.");
    }
    throw error;
  }
};
