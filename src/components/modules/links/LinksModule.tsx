"use client";

import { useMemo, useState } from "react";
import { Link2, Plus, Trash2, ExternalLink, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLinks, useAddLink, useDeleteLink } from "@/lib/hooks/useLinks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";

export function LinksModule() {
  const { data } = useLinks();
  const add = useAddLink();
  const del = useDeleteLink();

  const [url, setUrl] = useState("");
  const [collection, setCollection] = useState("");
  const [search, setSearch] = useState("");
  const [activeCollection, setActiveCollection] = useState<string | null>(null);

  const links = data?.links ?? [];
  const collections = data?.collections ?? [];

  const filtered = useMemo(() => {
    return links.filter((l) => {
      if (activeCollection && l.collection !== activeCollection) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (l.title ?? "").toLowerCase().includes(q) ||
          l.url.toLowerCase().includes(q) ||
          (l.description ?? "").toLowerCase().includes(q) ||
          l.tags.some((t) => t.toLowerCase().includes(q));
      }
      return true;
    });
  }, [links, search, activeCollection]);

  const submit = async () => {
    if (!url.trim()) return;
    const u = /^https?:\/\//.test(url) ? url.trim() : `https://${url.trim()}`;
    await add.mutateAsync({ url: u, collection: collection.trim() || null });
    setUrl("");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-display !text-2xl">Links &amp; Resources</h2>
        <p className="mt-1 text-body text-muted">Save anything worth coming back to.</p>
      </div>

      {/* Add */}
      <div className="rounded-lg border border-line bg-panel p-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-48 flex-1">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Paste a URL…" />
          </div>
          <Input value={collection} onChange={(e) => setCollection(e.target.value)} placeholder="Collection (optional)" className="w-44" list="collection-list" />
          <datalist id="collection-list">{collections.map((c) => <option key={c} value={c} />)}</datalist>
          <Button onClick={submit} disabled={add.isPending}>{add.isPending ? "Saving…" : <><Plus /> Save</>}</Button>
        </div>
      </div>

      {/* Filters */}
      {links.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-9 items-center gap-2 rounded-md border border-line bg-panel px-3">
            <Search className="size-3.5 text-faint" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search links…" className="h-full bg-transparent text-small text-fg outline-none placeholder:text-faint" />
          </div>
          <button onClick={() => setActiveCollection(null)} className={cn("rounded-full px-3 py-1 text-small font-medium", !activeCollection ? "bg-accent-muted text-accent" : "text-muted hover:bg-inset")}>All</button>
          {collections.map((c) => (
            <button key={c} onClick={() => setActiveCollection(c)} className={cn("rounded-full px-3 py-1 text-small font-medium", activeCollection === c ? "bg-accent-muted text-accent" : "text-muted hover:bg-inset")}>{c}</button>
          ))}
        </div>
      )}

      {/* Grid */}
      {links.length === 0 ? (
        <EmptyState icon={<Link2 />} title="No links saved yet" description="Paste a URL above — Nexus pulls in the title and details automatically." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l) => (
            <div key={l.id} className="group flex flex-col rounded-lg border border-line bg-panel p-3">
              <div className="flex items-start justify-between gap-2">
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-1.5 text-small font-medium text-fg hover:text-accent">
                  <ExternalLink className="size-3.5 shrink-0 text-muted" />
                  <span className="truncate">{l.title || l.url}</span>
                </a>
                <button onClick={() => del.mutate(l.id)} className="shrink-0 text-faint opacity-0 hover:text-red-500 group-hover:opacity-100" aria-label="Delete link"><Trash2 className="size-3.5" /></button>
              </div>
              {l.description && <p className="mt-1 line-clamp-2 text-small text-muted">{l.description}</p>}
              <div className="mt-2 flex items-center gap-2">
                <span className="truncate font-data text-[0.625rem] text-faint">{(() => { try { return new URL(l.url).hostname.replace(/^www\./, ""); } catch { return l.url; } })()}</span>
                {l.collection && <span className="ml-auto rounded-full bg-inset px-1.5 py-0.5 text-micro text-muted">{l.collection}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
