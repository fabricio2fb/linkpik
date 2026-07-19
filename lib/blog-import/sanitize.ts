import sanitizeHtmlLib from "sanitize-html";
import { BlogImportError } from "./errors";

const BLOG_HTML_CLASSES = [
  "blog-badge",
  "blog-meta",
  "blog-callout",
  "blog-callout-tip",
  "blog-callout-warning",
  "blog-card",
  "blog-checklist",
  "blog-cta",
  "blog-faq-item",
];

const FORBIDDEN_PATTERN = /<(script|iframe|object|embed|form|input|textarea|select|button|link|meta)\b|on[a-z]+\s*=|javascript:/i;

export function sanitizeImportedBlogHtml(input: string) {
  if (FORBIDDEN_PATTERN.test(input)) {
    throw new BlogImportError("HTML_REJECTED", 422, "HTML rejeitado por conter elementos ou atributos inseguros.");
  }

  const clean = sanitizeHtmlLib(input, {
    allowedTags: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "blockquote",
      "ul",
      "ol",
      "li",
      "a",
      "img",
      "figure",
      "figcaption",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "pre",
      "code",
      "div",
      "span",
      "hr",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel", "class"],
      img: ["src", "alt", "title", "width", "height", "class"],
      "*": ["class"],
    },
    allowedClasses: {
      "*": BLOG_HTML_CLASSES,
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https"],
    },
    transformTags: {
      a: sanitizeHtmlLib.simpleTransform("a", { rel: "noopener noreferrer" }, true),
    },
    disallowedTagsMode: "discard",
    parseStyleAttributes: false,
  }).trim();

  if (!clean) throw new BlogImportError("HTML_REJECTED", 422, "HTML vazio apos sanitizacao.");
  return clean;
}
