import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { randomBytes } from "node:crypto";

// Local filesystem storage for user uploads. Files live under /uploads at the
// project root (gitignored). Each file gets an unguessable storage key; access
// is always gated by an authenticated, ownership-checked route.

const UPLOAD_DIR = join(process.cwd(), "uploads");

export const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

export const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/svg+xml",
  "text/plain",
  "text/markdown",
]);

export function storageKeyFor(filename: string): string {
  const ext = filename.includes(".") ? filename.slice(filename.lastIndexOf(".")) : "";
  return `${randomBytes(16).toString("hex")}${ext.toLowerCase()}`;
}

export async function saveFile(key: string, data: Buffer): Promise<void> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(join(UPLOAD_DIR, key), data);
}

export async function readStoredFile(key: string): Promise<Buffer> {
  return readFile(join(UPLOAD_DIR, key));
}

export async function deleteStoredFile(key: string): Promise<void> {
  await unlink(join(UPLOAD_DIR, key)).catch(() => {
    // already gone — fine
  });
}
