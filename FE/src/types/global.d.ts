import type { Socket } from "socket.io-client";

declare global {
  interface Window {
    __app_socket__?: Socket | null;
    __app_socket_user_id__?: string | null;
    __app_admin_socket__?: Socket | null;
    __admin_socket_active__?: boolean;
  }

  type PageProps<T extends string = string> = {
    params: Promise<{
      [K in ExtractParams<T>]: string;
    }>;
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
  };

  type ExtractParams<T extends string> = T extends `${string}[${infer Param}]${infer Rest}`
    ? Param | ExtractParams<Rest>
    : never;
}

export {};
