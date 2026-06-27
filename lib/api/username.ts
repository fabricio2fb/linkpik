export function generateUsername(email: string): string {
  const base = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 20) || "creator";
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}${suffix}`;
}
