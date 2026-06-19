import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser, badRequest, json } from "@/lib/api";
import {
  MAX_FILE_BYTES, ALLOWED_MIME, storageKeyFor, saveFile,
} from "@/lib/storage";

export async function GET(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const noteId = url.searchParams.get("noteId") ?? undefined;

  const files = await prisma.attachment.findMany({
    where: { userId: auth.userId, ...(noteId ? { noteId } : {}) },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, mimeType: true, size: true,
      noteId: true, collection: true, createdAt: true,
    },
  });
  const collections = [...new Set(files.map((f) => f.collection).filter(Boolean))] as string[];

  return json({
    files: files.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() })),
    collections,
  });
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const form = await req.formData().catch(() => null);
  if (!form) return badRequest("Expected a file upload.");

  const file = form.get("file");
  const noteId = (form.get("noteId") as string) || null;
  const collection = (form.get("collection") as string) || null;

  if (!(file instanceof File)) return badRequest("No file provided.");
  if (file.size > MAX_FILE_BYTES) return badRequest("File is larger than 25 MB.");
  if (file.size === 0) return badRequest("That file is empty.");

  const mime = file.type || "application/octet-stream";
  if (!ALLOWED_MIME.has(mime)) {
    return badRequest("Unsupported file type. Upload a PDF, image, or text file.");
  }

  if (noteId) {
    const note = await prisma.note.findFirst({
      where: { id: noteId, userId: auth.userId }, select: { id: true },
    });
    if (!note) return badRequest("That note doesn't exist.");
  }

  const key = storageKeyFor(file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  await saveFile(key, buffer);

  const attachment = await prisma.attachment.create({
    data: {
      userId: auth.userId,
      name: file.name || "upload",
      mimeType: mime,
      size: file.size,
      storageKey: key,
      noteId,
      collection,
    },
    select: { id: true, name: true, mimeType: true, size: true, noteId: true, collection: true, createdAt: true },
  });

  return json({ file: { ...attachment, createdAt: attachment.createdAt.toISOString() } }, { status: 201 });
}
