"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { normalizeKeyword } from "@/utils/keyword";

type ReplaceQueryInput = {
  page?: number;
  keyword?: string;
  pageKey?: string;
  keywordKey?: string;
};

export const useListQueryState = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();

  const getPage = useCallback(
    (pageKey = "page") => {
      const params = new URLSearchParams(queryKey);
      return Math.max(1, parseInt(params.get(pageKey) || "1", 10) || 1);
    },
    [queryKey]
  );

  const getKeyword = useCallback(
    (keywordKey = "keyword") => {
      const params = new URLSearchParams(queryKey);
      return params.get(keywordKey) || "";
    },
    [queryKey]
  );

  const replaceQuery = useCallback(
    ({
      page = 1,
      keyword = "",
      pageKey = "page",
      keywordKey = "keyword",
    }: ReplaceQueryInput) => {
      const params = new URLSearchParams();
      if (page > 1) params.set(pageKey, String(page));
      const normalizedKeyword = normalizeKeyword(keyword);
      if (normalizedKeyword.isValid && normalizedKeyword.value) {
        params.set(keywordKey, normalizedKeyword.value);
      }

      const query = params.toString();
      const nextUrl = `${pathname}${query ? `?${query}` : ""}`;
      if (
        typeof window !== "undefined" &&
        `${window.location.pathname}${window.location.search}` === nextUrl
      ) {
        return;
      }
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", nextUrl);
        return;
      }
      router.replace(nextUrl);
    },
    [pathname, router]
  );

  return {
    searchParams,
    queryKey,
    getPage,
    getKeyword,
    replaceQuery,
  };
};
