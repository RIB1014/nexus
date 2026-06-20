"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  rectSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  MoreHorizontal,
  Plus,
  ExternalLink,
  X,
  LayoutGrid,
} from "lucide-react";
import type { DashboardData } from "@/lib/data/dashboard";
import { widgetFor } from "./widgets";
import { getModule } from "@/lib/modules/registry";
import { moduleColor } from "@/lib/modules/colors";
import { ColorIcon } from "@/components/ui/color-picker";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Widget {
  id: string;
  moduleId: string;
}

interface Props {
  initialWidgets: Widget[];
  enabledModuleIds: string[];
  data: DashboardData;
}

async function persist(widgets: Widget[]) {
  await fetch("/api/dashboard/layout", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ widgets }),
  }).catch(() => {
    /* layout save is best-effort */
  });
}

export function DashboardGrid({ initialWidgets, enabledModuleIds, data }: Props) {
  const [widgets, setWidgets] = useState<Widget[]>(initialWidgets);
  // dnd-kit assigns non-deterministic aria ids during SSR; render a static grid
  // until mounted, then enable drag-and-drop. Avoids a hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function commit(next: Widget[]) {
    setWidgets(next);
    persist(next);
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = widgets.findIndex((w) => w.id === active.id);
    const newIndex = widgets.findIndex((w) => w.id === over.id);
    commit(arrayMove(widgets, oldIndex, newIndex));
  }

  function remove(id: string) {
    commit(widgets.filter((w) => w.id !== id));
  }

  function add(moduleId: string) {
    commit([
      ...widgets,
      { id: `w-${moduleId}-${Date.now()}`, moduleId },
    ]);
  }

  const pinnedModuleIds = new Set(widgets.map((w) => w.moduleId));
  const addable = enabledModuleIds.filter((id) => !pinnedModuleIds.has(id));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="group-title !pb-0">Overview</h3>
          <p className="mt-0.5 text-small text-muted">Drag to rearrange · pin what you check most.</p>
        </div>
        {addable.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm">
                <Plus /> Add widget
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {addable.map((id) => {
                const mod = getModule(id);
                if (!mod) return null;
                const Icon = mod.icon;
                return (
                  <DropdownMenuItem key={id} onSelect={() => add(id)}>
                    <Icon /> {mod.name}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {widgets.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid />}
          title="Your dashboard is a blank canvas"
          description="Pin a widget to see what matters at a glance the moment you open Orbit."
          action={
            addable.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    <Plus /> Add your first widget
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  {addable.map((id) => {
                    const mod = getModule(id);
                    if (!mod) return null;
                    const Icon = mod.icon;
                    return (
                      <DropdownMenuItem key={id} onSelect={() => add(id)}>
                        <Icon /> {mod.name}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild>
                <Link href="/settings/modules">Enable a module</Link>
              </Button>
            )
          }
        />
      ) : !mounted ? (
        // Static, hydration-safe render until the client mounts.
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {widgets.map((w) => (
            <WidgetFrame key={w.id} widget={w} data={data} onRemove={() => remove(w.id)} />
          ))}
        </div>
      ) : (
        <DndContext
          id="dashboard-grid"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={widgets.map((w) => w.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {widgets.map((w) => (
                <SortableWidget
                  key={w.id}
                  widget={w}
                  data={data}
                  onRemove={() => remove(w.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortableWidget({
  widget,
  data,
  onRemove,
}: {
  widget: Widget;
  data: DashboardData;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: widget.id });

  return (
    <WidgetFrame
      widget={widget}
      data={data}
      onRemove={onRemove}
      dragRef={setNodeRef}
      dragStyle={{ transform: CSS.Transform.toString(transform), transition }}
      dragging={isDragging}
      handleProps={{ ...attributes, ...listeners }}
    />
  );
}

/** Presentational widget card, shared by the static and sortable renders. */
function WidgetFrame({
  widget,
  data,
  onRemove,
  dragRef,
  dragStyle,
  dragging,
  handleProps,
}: {
  widget: Widget;
  data: DashboardData;
  onRemove: () => void;
  dragRef?: (node: HTMLElement | null) => void;
  dragStyle?: React.CSSProperties;
  dragging?: boolean;
  handleProps?: React.HTMLAttributes<HTMLButtonElement>;
}) {
  const meta = widgetFor(widget.moduleId);
  const Icon = meta.icon;
  const Body = meta.Component;
  const color = moduleColor(widget.moduleId);

  return (
    <div
      ref={dragRef}
      style={{ ...dragStyle, borderTopColor: color, borderTopWidth: 2 }}
      className={`app-card flex min-h-[200px] flex-col ${
        dragging ? "z-10 opacity-80 shadow-pop" : ""
      }`}
    >
      <div className="flex items-center gap-2.5 border-b border-line px-3 py-2.5">
        <button
          {...handleProps}
          className="cursor-grab text-faint hover:text-muted active:cursor-grabbing"
          aria-label="Drag widget"
        >
          <GripVertical className="size-4" />
        </button>
        <ColorIcon color={color} className="size-7 [&_svg]:size-4">
          <Icon />
        </ColorIcon>
        <h3 className="flex-1 text-small font-semibold text-fg">{meta.title}</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex size-7 items-center justify-center rounded-md text-faint hover:bg-inset hover:text-fg"
              aria-label="Widget options"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={meta.href}>
                <ExternalLink /> Go to full page
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem destructive onSelect={onRemove}>
              <X /> Remove from dashboard
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex-1 p-3">
        <Body data={data} />
      </div>
    </div>
  );
}
