import { v4 as uuidv4 } from "uuid";

export function getSafeKey(originalName: string) {
  const ext = originalName.includes(".") ? originalName.split(".").pop() : "pdf";
  // Optionally keep sanitized base name for readability:
  const base = originalName.replace(/\.[^.]*$/, "") // remove extension
    .replace(/[^a-zA-Z0-9-_]/g, "_")              // allow only safe chars
    .slice(0, 50);                                // avoid extremely long names
  return `${Date.now()}-${uuidv4()}-${base}.${ext}`;
}
