import { FilterQuery, Model, PipelineStage, Types } from "mongoose";
import { decodeQueryValue } from "./query.helper";

const ATLAS_SEARCH_INDEX = process.env.ATLAS_SEARCH_INDEX || "default";

const isAtlasSearchUnavailableError = (error: unknown): boolean => {
  const err = error as { message?: string };
  const message = String(err?.message || "").toLowerCase();
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

interface IdResultDoc {
  _id: Types.ObjectId;
}

export const findIdsByKeyword = async <T>({
  model,
  keyword,
  atlasPaths,
  atlasMatch,
  limit = 2000,
}: FindIdsByKeywordParams<T>): Promise<string[]> => {
  const normalizedKeyword = decodeQueryValue(keyword);
  if (!normalizedKeyword) return [];
  if (!/[\p{L}\p{N}]/u.test(normalizedKeyword)) return [];

  const pipeline: PipelineStage[] = [
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
    const results = await model.aggregate<IdResultDoc>(pipeline);
    return results.map((item) => item._id?.toString()).filter((id): id is string => Boolean(id));
  } catch (error) {
    if (isAtlasSearchUnavailableError(error)) {
      throw new Error("Atlas Search is unavailable. Please verify Atlas tier and search indexes.");
    }
    throw error;
  }
};
