"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { MODULE_MAP } from "@/lib/modules/registry";

export function SidebarOrderManager({ enabledIds }: { enabledIds: string[] }) {
  const router = useRouter();
  const [ids, setIds] = useState(enabledIds);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Keep in sync if the enabled set changes (e.g. a module toggled elsewhere).
  useEffect(() => setIds(enabledIds), [enabledIds]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function persist(order: string[]) {
    await fetch("/api/modules/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    }).catch(() => {});
    router.refresh();
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const next = arrayMove(
      ids,
      ids.indexOf(active.id as string),
      ids.indexOf(over.id as string),
    );
    setIds(next);
    persist(next);
  }

  if (enabledIds.length === 0) {
    return (
      <p className="text-small text-muted">
        Enable a module below to arrange it in your sidebar.
      </p>
    );
  }

  const rows = ids.map((id) => MODULE_MAP[id]).filter(Boolean);
  const list = (
    <div className="overflow-hidden rounded-lg border border-line bg-panel">
      {rows.map((m) => (
        <Row key={m.id} id={m.id} name={m.name} icon={m.icon} draggable={mounted} />
      ))}
    </div>
  );

  if (!mounted) return list;

  return (
    <DndContext
      id="sidebar-order"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {list}
      </SortableContext>
    </DndContext>
  );
}

function Row({
  id,
  name,
  icon: Icon,
  draggable,
}: {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  draggable: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled: !draggable });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-0 ${
        isDragging ? "z-10 bg-inset shadow-sm" : ""
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-faint hover:text-muted active:cursor-grabbing"
        aria-label={`Reorder ${name}`}
      >
        <GripVertical className="size-4" />
      </button>
      <Icon className="size-4 text-muted" />
      <span className="text-small font-medium text-fg">{name}</span>
    </div>
  );
}
