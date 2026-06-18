import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser, badRequest, json } from "@/lib/api";

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const links = await prisma.link.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: "desc" },
  });
  const collections = [...new Set(links.map((l) => l.collection).filter(Boolean))] as string[];
  return json({
    links: links.map((l) => ({
      id: l.id, url: l.url, title: l.title, description: l.description,
      imageUrl: l.imageUrl, collection: l.collection, tags: l.tags, createdAt: l.createdAt.toISOString(),
    })),
    collections,
  });
}

const createSchema = z.object({
  url: z.string().url(),
  title: z.string().max(300).optional(),
  description: z.string().max(1000).optional(),
  collection: z.string().max(60).nullable().optional(),
  tags: z.array(z.string().max(40)).optional(),
});

/** Best-effort fetch of OpenGraph/title metadata for a URL. */
async function scrapeMeta(url: string): Promise<{ title?: string; description?: string; image?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NexusBot/1.0)" },
    });
    clearTimeout(timeout);
    const html = await res.text();
    const pick = (re: RegExp) => html.match(re)?.[1]?.trim();
    const og = (p: string) =>
      pick(new RegExp(`<meta[^>]+property=["']og:${p}["'][^>]+content=["']([^"']+)["']`, "i")) ||
      pick(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${p}["']`, "i"));
    return {
      title: og("title") || pick(/<title[^>]*>([^<]+)<\/title>/i),
      description: og("description") ||
        pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i),
      image: og("image"),
    };
  } catch {
    return {};
  }
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return badRequest("Enter a valid URL.");

  // Scrape metadata only if the user didn't supply a title.
  const meta = parsed.data.title ? {} : await scrapeMeta(parsed.data.url);
  let host = parsed.data.url;
  try { host = new URL(parsed.data.url).hostname.replace(/^www\./, ""); } catch {}

  const link = await prisma.link.create({
    data: {
      userId: auth.userId,
      url: parsed.data.url,
      title: parsed.data.title || meta.title || host,
      description: parsed.data.description || meta.description || null,
      imageUrl: meta.image || null,
      collection: parsed.data.collection ?? null,
      tags: parsed.data.tags ?? [],
    },
  });
  return json({ link }, { status: 201 });
}
