"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Plus, FileText, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NoteTreeItem } from "@/types/note";

interface TreeNode extends NoteTreeItem {
  children: TreeNode[];
}

function buildTree(items: NoteTreeItem[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  items.forEach((i) => map.set(i.id, { ...i, children: [] }));
  const roots: TreeNode[] = [];
  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) map.get(node.parentId)!.children.push(node);
    else roots.push(node);
  }
  const sortRec = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.order - b.order);
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

export function NotesTree({
  notes,
  selectedId,
  onSelect,
  onCreate,
}: {
  notes: NoteTreeItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (parentId: string | null) => void;
}) {
  const [search, setSearch] = useState("");
  const tree = useMemo(() => buildTree(notes), [notes]);

  const filtered = search.trim()
    ? notes.filter((n) => n.title.toLowerCase().includes(search.toLowerCase()))
    : null;

  return (
    <aside className="flex w-full flex-col gap-2 lg:w-60 lg:shrink-0">
      <div className="flex items-center gap-2 rounded-md border border-line bg-panel px-2.5">
        <Search className="size-3.5 text-faint" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search pages…"
          className="h-8 flex-1 bg-transparent text-small text-fg outline-none placeholder:text-faint"
        />
      </div>

      <button
        onClick={() => onCreate(null)}
        className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-small font-medium text-accent hover:bg-inset"
      >
        <Plus className="size-4" /> New page
      </button>

      <div className="flex flex-col">
        {filtered ? (
          filtered.length === 0 ? (
            <p className="px-2.5 py-2 text-small text-faint">No pages match.</p>
          ) : (
            filtered.map((n) => (
              <FlatRow key={n.id} note={n} active={selectedId === n.id} onSelect={onSelect} />
            ))
          )
        ) : (
          tree.map((n) => (
            <TreeRow
              key={n.id}
              node={n}
              depth={0}
              selectedId={selectedId}
              onSelect={onSelect}
              onCreate={onCreate}
            />
          ))
        )}
      </div>
    </aside>
  );
}

function FlatRow({ note, active, onSelect }: { note: NoteTreeItem; active: boolean; onSelect: (id: string) => void }) {
  return (
    <button
      onClick={() => onSelect(note.id)}
      className={cn(
        "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-small transition-colors",
        active ? "bg-accent-muted text-accent" : "text-muted hover:bg-inset hover:text-fg",
      )}
    >
      <span className="text-sm leading-none">{note.emoji ?? "📄"}</span>
      <span className="truncate">{note.title}</span>
    </button>
  );
}

function TreeRow({
  node, depth, selectedId, onSelect, onCreate,
}: {
  node: TreeNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (parentId: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const active = selectedId === node.id;
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md pr-1 transition-colors",
          active ? "bg-accent-muted" : "hover:bg-inset",
        )}
        style={{ paddingLeft: depth * 14 }}
      >
        <button
          onClick={() => hasChildren && setExpanded((v) => !v)}
          className={cn("flex size-5 shrink-0 items-center justify-center text-faint", !hasChildren && "invisible")}
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          <ChevronRight className={cn("size-3.5 transition-transform", expanded && "rotate-90")} />
        </button>
        <button
          onClick={() => onSelect(node.id)}
          className={cn("flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left text-small", active ? "text-accent" : "text-muted group-hover:text-fg")}
        >
          <span className="text-sm leading-none">{node.emoji ?? <FileText className="size-3.5" />}</span>
          <span className="truncate">{node.title}</span>
        </button>
        <button
          onClick={() => onCreate(node.id)}
          className="flex size-6 shrink-0 items-center justify-center rounded text-faint opacity-0 transition-opacity hover:bg-line hover:text-fg group-hover:opacity-100"
          aria-label="Add subpage"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      {expanded &&
        node.children.map((c) => (
          <TreeRow key={c.id} node={c} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} onCreate={onCreate} />
        ))}
    </div>
  );
}
