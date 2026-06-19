"use client";

import { useRef, useState } from "react";
import { Paperclip, FileText, FileImage, File as FileIcon, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFiles, useUploadFile, useDeleteFile, formatBytes } from "@/lib/hooks/useFiles";

export function NoteAttachments({ noteId }: { noteId: string }) {
  const { data } = useFiles(noteId);
  const upload = useUploadFile();
  const del = useDeleteFile();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const files = data?.files ?? [];

  async function handle(list: FileList | null) {
    if (!list?.length) return;
    setBusy(true);
    for (const file of Array.from(list)) {
      await upload.mutateAsync({ file, noteId }).catch(() => {});
    }
    setBusy(false);
  }

  return (
    <div className="mt-4 border-t border-line pt-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-micro text-faint">
          <Paperclip className="size-3.5" /> Attachments
        </span>
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1 text-small font-medium text-accent hover:underline"
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Paperclip className="size-3.5" />}
          Attach file
        </button>
        <input ref={inputRef} type="file" multiple accept=".pdf,image/*,.txt,.md" className="hidden"
          onChange={(e) => { handle(e.target.files); e.target.value = ""; }} />
      </div>

      {files.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {files.map((f) => {
            const isImage = f.mimeType.startsWith("image/");
            const isPdf = f.mimeType === "application/pdf";
            return (
              <a
                key={f.id}
                href={`/api/files/${f.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 rounded-md border border-line bg-panel px-2.5 py-1.5"
              >
                {isPdf ? <FileText className="size-4 text-red-500" /> : isImage ? <FileImage className="size-4 text-accent" /> : <FileIcon className="size-4 text-muted" />}
                <span className="max-w-40 truncate text-small text-fg">{f.name}</span>
                <span className="text-[0.625rem] text-faint">{formatBytes(f.size)}</span>
                <button
                  onClick={(e) => { e.preventDefault(); del.mutate(f.id); }}
                  className={cn("text-faint hover:text-red-500")}
                  aria-label="Remove attachment"
                >
                  <X className="size-3.5" />
                </button>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
