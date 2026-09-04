export type LocationOption = {
  _id?: string;
  name?: string;
  slug?: string;
};

export type SkillItem = {
  slug?: string;
  name?: string;
};

/** Minimal surface of the TinyMCE editor instance the app actually uses. */
export type RichTextEditor = {
  getContent: () => string;
  setContent: (content: string) => void;
};

/** FilePond file entry: an already-uploaded source URL and/or a freshly picked File. */
export type UploadFile = { source?: string; file?: File };
