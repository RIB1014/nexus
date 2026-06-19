"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, ListChecks, Quote, Minus, Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { NoteDTO } from "@/types/note";
import { useUpdateNote, useDeleteNote } from "@/lib/hooks/useNotes";
import { NoteAttachments } from "./NoteAttachments";
import { Button } from "@/components/ui/button";

const EMOJIS = ["📄", "📝", "📚", "🎼", "💡", "✅", "📌", "🔖", "🧠", "⭐", "🗒️", "📈"];

export function NoteEditor({
  note,
  onDeleted,
}: {
  note: NoteDTO;
  onDeleted: () => void;
}) {
  const update = useUpdateNote();
  const del = useDeleteNote();

  const [title, setTitle] = useState(note.title);
  const [emoji, setEmoji] = useState(note.emoji);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [words, setWords] = useState(0);
  const [savedAt, setSavedAt] = useState<Date>(new Date(note.updatedAt));
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: "Start writing, or press / for commands…" }),
    ],
    content: (note.content as object) ?? { type: "doc", content: [{ type: "paragraph" }] },
    editorProps: {
      attributes: {
        class: "tiptap prose-nexus min-h-[50vh] outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      setWords(countWords(editor));
      scheduleSave({ content: editor.getJSON() });
    },
  });

  useEffect(() => {
    if (editor) setWords(countWords(editor));
  }, [editor]);

  const scheduleSave = useCallback(
    (patch: { content?: unknown; title?: string; emoji?: string | null }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        await update.mutateAsync({ id: note.id, patch });
        setSavedAt(new Date());
      }, 700);
    },
    [note.id, update],
  );

  // Flush a pending save when leaving the note.
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [note.id]);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* Title row */}
      <div className="flex items-center gap-3 px-1">
        <div className="relative">
          <button
            onClick={() => setEmojiOpen((v) => !v)}
            className="flex size-10 items-center justify-center rounded-md text-2xl hover:bg-inset"
          >
            {emoji ?? "📄"}
          </button>
          {emojiOpen && (
            <div className="absolute z-20 mt-1 grid grid-cols-6 gap-1 rounded-md border border-line bg-surface p-2 shadow-lg">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => { setEmoji(e); setEmojiOpen(false); scheduleSave({ emoji: e }); }}
                  className="flex size-8 items-center justify-center rounded text-xl hover:bg-inset"
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
        <input
          value={title}
          onChange={(e) => { setTitle(e.target.value); scheduleSave({ title: e.target.value }); }}
          placeholder="Untitled"
          className="flex-1 bg-transparent text-display !text-2xl outline-none placeholder:text-faint"
        />
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-faint hover:text-red-500"
          onClick={async () => { await del.mutateAsync(note.id); onDeleted(); }}
          aria-label="Delete page"
        >
          <Trash2 />
        </Button>
      </div>

      {/* Toolbar */}
      {editor && <Toolbar editor={editor} />}

      {/* Editor */}
      <div className="px-1 py-4">
        <EditorContent editor={editor} />
      </div>

      {/* Attachments */}
      <div className="px-1">
        <NoteAttachments noteId={note.id} />
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between border-t border-line px-1 py-2 text-small text-faint">
        <span>{words} word{words === 1 ? "" : "s"}</span>
        <span>Saved {formatDistanceToNow(savedAt, { addSuffix: true })}</span>
      </div>
    </div>
  );
}

function countWords(editor: Editor): number {
  const text = editor.getText().trim();
  return text ? text.split(/\s+/).length : 0;
}

function Toolbar({ editor }: { editor: Editor }) {
  const Btn = ({
    onClick, active, label, children,
  }: {
    onClick: () => void; active?: boolean; label: string; children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "flex size-8 items-center justify-center rounded-md transition-colors [&_svg]:size-4",
        active ? "bg-accent-muted text-accent" : "text-muted hover:bg-inset hover:text-fg",
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="sticky top-14 z-10 flex flex-wrap items-center gap-0.5 rounded-md border border-line bg-panel/90 p-1 backdrop-blur">
      <Btn label="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 /></Btn>
      <Btn label="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 /></Btn>
      <Btn label="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 /></Btn>
      <Divider />
      <Btn label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold /></Btn>
      <Btn label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic /></Btn>
      <Btn label="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough /></Btn>
      <Btn label="Inline code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}><Code /></Btn>
      <Divider />
      <Btn label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List /></Btn>
      <Btn label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered /></Btn>
      <Btn label="Checklist" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}><ListChecks /></Btn>
      <Divider />
      <Btn label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote /></Btn>
      <Btn label="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code /></Btn>
      <Btn label="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus /></Btn>
    </div>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-line" />;
}
