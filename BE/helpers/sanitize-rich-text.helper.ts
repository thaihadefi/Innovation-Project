import sanitizeHtml from "sanitize-html";

/**
 * Allowlist-based HTML sanitizer for user-generated rich text.
 * Strips all tags/attributes not explicitly listed — including <script>,
 * event handlers (onerror, onclick, etc.), and javascript: hrefs.
 *
 * Mirrors the tag/attribute set supported by the Quill / TipTap editor
 * used on the frontend so legitimate formatting survives the round-trip.
 */
const RICH_TEXT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "b", "strong", "i", "em", "u", "s", "strike",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li",
    "blockquote", "pre", "code",
    "a", "img",
    "table", "thead", "tbody", "tr", "th", "td",
    "span", "div",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height"],
    "*": ["class", "style"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  // Strip javascript: hrefs and data: URIs
  allowedSchemesByTag: {
    a: ["http", "https", "mailto"],
    img: ["http", "https"],
  },
};

/** Plain-text sanitization: strips all HTML tags entirely. */
const PLAIN_TEXT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
};

/**
 * Sanitize rich-text HTML input (preserves safe formatting tags).
 * Returns empty string for falsy input.
 */
export const sanitizeRichText = (input: string | undefined | null): string => {
  if (!input) return "";
  return sanitizeHtml(input, RICH_TEXT_OPTIONS);
};

/**
 * Strip all HTML from a field that should be plain text (e.g. job title).
 * Returns empty string for falsy input.
 */
export const stripHtml = (input: string | undefined | null): string => {
  if (!input) return "";
  return sanitizeHtml(input, PLAIN_TEXT_OPTIONS);
};
