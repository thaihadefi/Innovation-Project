"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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

  const getPage = useCallback(
    (pageKey = "page") =>
      Math.max(1, parseInt(searchParams.get(pageKey) || "1", 10) || 1),
    [searchParams]
  );

  const getKeyword = useCallback(
    (keywordKey = "keyword") => searchParams.get(keywordKey) || "",
    [searchParams]
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
      const trimmedKeyword = keyword.trim();
      if (trimmedKeyword) params.set(keywordKey, trimmedKeyword);

      const query = params.toString();
      const nextUrl = `${pathname}${query ? `?${query}` : ""}`;
      if (
        typeof window !== "undefined" &&
        `${window.location.pathname}${window.location.search}` === nextUrl
      ) {
        return;
      }
      router.replace(nextUrl);
    },
    [pathname, router]
  );

  return {
    searchParams,
    getPage,
    getKeyword,
    replaceQuery,
  };
};

