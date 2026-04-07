// Simple storage: saves files to disk and serves via Express static
// For OCR, returns both a served URL and a data URL for the OpenAI API
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const UPLOAD_DIR = join(process.cwd(), "uploads");

function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "").replace(/\.\./g, "");
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  ensureUploadDir();
  const key = normalizeKey(relKey);
  const filePath = join(UPLOAD_DIR, key);

  // Ensure subdirectory exists
  const dir = filePath.substring(0, filePath.lastIndexOf("/"));
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
  writeFileSync(filePath, buffer);

  // Return a data URL so OpenAI Vision API can access it directly
  const base64 = buffer.toString("base64");
  const url = `data:${contentType};base64,${base64}`;
  return { key, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/uploads/${key}` };
}
