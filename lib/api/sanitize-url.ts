export function sanitizeUrl(input: string): string {
  if (/^(javascript|data|vbscript):/i.test(input.trim())) return "";
  return input.trim();
}
