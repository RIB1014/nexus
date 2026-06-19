"use client";

import { Download, Trash2, ExternalLink } from "lucide-react";
import type { FileDTO } from "@/lib/hooks/useFiles";
import { formatBytes, useDeleteFile } from "@/lib/hooks/useFiles";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function FilePreviewDialog({
  file, open, onOpenChange,
}: {
  file: FileDTO | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const del = useDeleteFile();
  if (!file) return null;

  const src = `/api/files/${file.id}`;
  const isImage = file.mimeType.startsWith("image/");
  const isPdf = file.mimeType === "application/pdf";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[min(92vw,900px)] max-w-none gap-3">
        <div className="flex items-center justify-between gap-3">
          <DialogTitle className="truncate text-heading">{file.name}</DialogTitle>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button asChild variant="ghost" size="icon-sm" title="Open in new tab">
              <a href={src} target="_blank" rel="noopener noreferrer"><ExternalLink /></a>
            </Button>
            <Button asChild variant="ghost" size="icon-sm" title="Download">
              <a href={src} download={file.name}><Download /></a>
            </Button>
            <Button
              variant="ghost" size="icon-sm"
              className="text-red-500 hover:bg-red-500/10"
              onClick={async () => { await del.mutateAsync(file.id); onOpenChange(false); }}
              title="Delete"
            >
              <Trash2 />
            </Button>
          </div>
        </div>

        <div className="flex max-h-[78vh] items-center justify-center overflow-auto rounded-md border border-line bg-inset/40">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={file.name} className="max-h-[78vh] w-auto object-contain" />
          ) : isPdf ? (
            <iframe src={src} title={file.name} className="h-[78vh] w-full" />
          ) : (
            <div className="p-10 text-center text-small text-muted">
              <p>{formatBytes(file.size)} · {file.mimeType}</p>
              <Button asChild className="mt-3"><a href={src} download={file.name}><Download /> Download</a></Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
