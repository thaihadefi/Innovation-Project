

type PageProps<T extends string = string> = {
  params: Promise<{
    [K in ExtractParams<T>]: string;
  }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

type ExtractParams<T extends string> = T extends `${string}[${infer Param}]${infer Rest}`
  ? Param | ExtractParams<Rest>
  : never;
