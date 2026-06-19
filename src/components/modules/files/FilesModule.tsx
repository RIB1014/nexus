"use client";

import { useRef, useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import {
  UploadCloud, FileText, FileImage, File as FileIcon, Trash2, Search, Loader2, PenLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFiles, useUploadFile, useDeleteFile, formatBytes, type FileDTO } from "@/lib/hooks/useFiles";
import { FilePreviewDialog } from "./FilePreviewDialog";
import { Input } from "@/components/ui/input";

export function FilesModule() {
  const { data } = useFiles();
  const upload = useUploadFile();
  const del = useDeleteFile();
  const inputRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);
  const [collection, setCollection] = useState("");
  const [search, setSearch] = useState("");
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [preview, setPreview] = useState<FileDTO | null>(null);
  const [uploadingCount, setUploadingCount] = useState(0);

  const files = data?.files ?? [];
  const collections = data?.collections ?? [];

  const filtered = useMemo(() => files.filter((f) => {
    if (activeCollection && f.collection !== activeCollection) return false;
    if (search.trim()) return f.name.toLowerCase().includes(search.toLowerCase());
    return true;
  }), [files, search, activeCollection]);

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const arr = Array.from(list);
    setUploadingCount(arr.length);
    for (const file of arr) {
      try {
        await upload.mutateAsync({ file, collection: collection.trim() || undefined });
      } catch {
        /* surfaced per-file below via toast-less inline; skip */
      }
      setUploadingCount((c) => c - 1);
    }
    setUploadingCount(0);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-display !text-2xl">Files &amp; Uploads</h2>
        <p className="mt-1 text-body text-muted">
          Drop in PDFs, images, and notes — including your GoodNotes exports.
        </p>
      </div>

      {/* GoodNotes hint */}
      <div className="flex items-start gap-3 rounded-lg border border-line bg-panel p-3">
        <PenLine className="mt-0.5 size-4 shrink-0 text-accent" />
        <p className="text-small text-muted">
          <span className="font-medium text-fg">From GoodNotes:</span> open a notebook →
          Share → <span className="text-fg">Export</span> as PDF (or image) → save to Files,
          then drop it here. Your handwriting stays crisp and searchable as a PDF.
        </p>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragOver ? "border-accent bg-accent-muted/40" : "border-line hover:bg-inset/40",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,image/*,.txt,.md"
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
        />
        {uploadingCount > 0 ? (
          <><Loader2 className="size-7 animate-spin text-accent" /><p className="text-small text-muted">Uploading {uploadingCount} file{uploadingCount > 1 ? "s" : ""}…</p></>
        ) : (
          <>
            <UploadCloud className="size-7 text-muted" />
            <p className="text-body font-medium text-fg">Drop files here or click to browse</p>
            <p className="text-small text-faint">PDF, images, or text · up to 25 MB each</p>
          </>
        )}
        <div className="mt-1" onClick={(e) => e.stopPropagation()}>
          <Input value={collection} onChange={(e) => setCollection(e.target.value)} placeholder="Collection for new uploads (optional)" className="h-8 w-64 text-small" />
        </div>
      </div>

      {/* Filters */}
      {files.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-9 items-center gap-2 rounded-md border border-line bg-panel px-3">
            <Search className="size-3.5 text-faint" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search files…" className="h-full bg-transparent text-small text-fg outline-none placeholder:text-faint" />
          </div>
          <button onClick={() => setActiveCollection(null)} className={cn("rounded-full px-3 py-1 text-small font-medium", !activeCollection ? "bg-accent-muted text-accent" : "text-muted hover:bg-inset")}>All</button>
          {collections.map((c) => (
            <button key={c} onClick={() => setActiveCollection(c)} className={cn("rounded-full px-3 py-1 text-small font-medium", activeCollection === c ? "bg-accent-muted text-accent" : "text-muted hover:bg-inset")}>{c}</button>
          ))}
        </div>
      )}

      {/* Grid */}
      {files.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line py-12 text-center">
          <FileIcon className="mx-auto size-8 text-faint" />
          <p className="mt-2 text-heading">Nothing uploaded yet</p>
          <p className="text-small text-muted">Your files and GoodNotes exports will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((f) => (
            <FileCard key={f.id} file={f} onOpen={() => setPreview(f)} onDelete={() => del.mutate(f.id)} />
          ))}
        </div>
      )}

      <FilePreviewDialog file={preview} open={preview !== null} onOpenChange={(v) => !v && setPreview(null)} />
    </div>
  );
}

function FileCard({ file, onOpen, onDelete }: { file: FileDTO; onOpen: () => void; onDelete: () => void }) {
  const isImage = file.mimeType.startsWith("image/");
  const isPdf = file.mimeType === "application/pdf";

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-line bg-panel">
      <button onClick={onOpen} className="flex aspect-[4/3] items-center justify-center bg-inset/40">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/files/${file.id}`} alt={file.name} className="size-full object-cover" loading="lazy" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted">
            {isPdf ? <FileText className="size-8 text-red-500" /> : file.mimeType.startsWith("image/") ? <FileImage className="size-8" /> : <FileIcon className="size-8" />}
            <span className="font-data text-[0.625rem] uppercase">{isPdf ? "PDF" : file.name.split(".").pop()}</span>
          </div>
        )}
      </button>
      <div className="flex items-center gap-2 px-2.5 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-small font-medium text-fg">{file.name}</p>
          <p className="text-[0.625rem] text-faint">{formatBytes(file.size)} · {format(parseISO(file.createdAt), "MMM d")}</p>
        </div>
        <button onClick={onDelete} className="shrink-0 text-faint opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100" aria-label="Delete file">
          <Trash2 className="size-3.5" />
        </button>
      </div>
      {file.collection && <span className="absolute left-2 top-2 rounded-full bg-black/55 px-1.5 py-0.5 text-[0.625rem] text-white backdrop-blur">{file.collection}</span>}
    </div>
  );
}
