import type { UploadFile } from "@/types/common";

/**
 * react-filepond types the `files` prop and the `onupdatefiles` callback with
 * different shapes and does not model the round trip, so these adapters bridge
 * our own `UploadFile` state to what the component expects.
 */
export const toFilePondFiles = (files: UploadFile[]): (File | string)[] =>
  files
    .map((f) => f.file ?? f.source)
    .filter((x): x is File | string => x != null);

export const fromFilePondFiles = (
  items: { file?: unknown; source?: unknown }[]
): UploadFile[] =>
  items.map((i) => ({
    file: i.file instanceof File ? i.file : undefined,
    source: typeof i.source === "string" ? i.source : undefined,
  }));
