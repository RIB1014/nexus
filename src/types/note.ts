export interface NoteTreeItem {
  id: string;
  title: string;
  emoji: string | null;
  parentId: string | null;
  order: number;
  updatedAt: string;
}

export interface NoteDTO extends NoteTreeItem {
  content: unknown; // Tiptap JSON
  tags: string[];
  createdAt: string;
}
