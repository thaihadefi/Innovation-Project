
// Global type declarations for the application

// Page props type for dynamic route pages
type PageProps<T extends string = string> = {
  params: Promise<{
    [K in ExtractParams<T>]: string;
  }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Helper type to extract params from route
type ExtractParams<T extends string> = T extends `${string}[${infer Param}]${infer Rest}`
  ? Param | ExtractParams<Rest>
  : never;
