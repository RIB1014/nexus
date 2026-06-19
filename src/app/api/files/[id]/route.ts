import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser, notFound, json } from "@/lib/api";
import { readStoredFile, deleteStoredFile } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

// Serve the raw file bytes (auth + ownership checked). Inline for preview.
export async function GET(_req: Request, { params }: Ctx) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const file = await prisma.attachment.findFirst({
    where: { id, userId: auth.userId },
  });
  if (!file) return notFound("File not found.");

  try {
    const data = await readStoredFile(file.storageKey);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(file.name)}"`,
        "Content-Length": String(file.size),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return notFound("File data is missing.");
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const file = await prisma.attachment.findFirst({
    where: { id, userId: auth.userId },
    select: { id: true, storageKey: true },
  });
  if (!file) return notFound("File not found.");

  await prisma.attachment.delete({ where: { id } });
  await deleteStoredFile(file.storageKey);
  return json({ ok: true });
}
