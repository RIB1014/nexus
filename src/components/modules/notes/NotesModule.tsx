"use client";

import { useEffect, useState } from "react";
import { NotebookPen, Plus } from "lucide-react";
import { useNotesTree, useNote, useCreateNote } from "@/lib/hooks/useNotes";
import { NotesTree } from "./NotesTree";
import { NoteEditor } from "./NoteEditor";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function NotesModule() {
  const { data: treeData, isLoading } = useNotesTree();
  const create = useCreateNote();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const notes = treeData?.notes ?? [];
  const { data: noteData } = useNote(selectedId);

  // Auto-select the first page once the tree loads.
  useEffect(() => {
    if (!selectedId && notes.length > 0) setSelectedId(notes[0].id);
    if (selectedId && notes.length > 0 && !notes.some((n) => n.id === selectedId)) {
      setSelectedId(notes[0]?.id ?? null);
    }
    if (notes.length === 0) setSelectedId(null);
  }, [notes, selectedId]);

  const createPage = async (parentId: string | null) => {
    const res = await create.mutateAsync({ parentId });
    setSelectedId(res.note.id);
  };

  if (isLoading) {
    return (
      <div className="flex gap-8">
        <Skeleton className="h-64 w-60" />
        <Skeleton className="h-64 flex-1" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      <NotesTree
        notes={notes}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={createPage}
      />

      {notes.length === 0 ? (
        <div className="flex-1">
          <EmptyState
            icon={<NotebookPen />}
            title="A blank page awaits"
            description="Capture lecture notes, project plans, or a fleeting idea. Everything links together."
            action={<Button onClick={() => createPage(null)}><Plus /> Create your first page</Button>}
          />
        </div>
      ) : noteData?.note ? (
        <NoteEditor
          key={noteData.note.id}
          note={noteData.note}
          onDeleted={() => setSelectedId(null)}
        />
      ) : (
        <div className="flex-1">
          <Skeleton className="h-64 w-full" />
        </div>
      )}
    </div>
  );
}
