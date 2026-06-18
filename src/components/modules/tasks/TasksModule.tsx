"use client";

import { useMemo, useState } from "react";
import {
  ListTodo,
  LayoutGrid,
  CalendarDays,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasks, useTaskLists, type TaskFilter } from "@/lib/hooks/useTasks";
import type { TaskDTO } from "@/types/task";
import { SMART_LISTS } from "@/types/task";
import { TaskSidebar, type Selection } from "./TaskSidebar";
import { QuickAddBar } from "./QuickAddBar";
import { TaskListView } from "./TaskListView";
import { TaskBoardView } from "./TaskBoardView";
import { TaskCalendarView } from "./TaskCalendarView";
import { TaskDetailDialog } from "./TaskDetailDialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ViewMode = "list" | "board" | "calendar";
type Sort = "due" | "priority" | "created" | "manual";

const SORT_LABELS: Record<Sort, string> = {
  due: "Due date",
  priority: "Priority",
  created: "Recently added",
  manual: "Manual",
};

const VIEW_MODES: { id: ViewMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "list", label: "List", icon: ListTodo },
  { id: "board", label: "Board", icon: LayoutGrid },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
];

export function TasksModule() {
  const { data: listsData } = useTaskLists();
  const lists = useMemo(() => listsData?.lists ?? [], [listsData]);

  const [selection, setSelection] = useState<Selection>({ kind: "smart", id: "today" });
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sort, setSort] = useState<Sort>("due");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filter: TaskFilter = useMemo(() => {
    const base: TaskFilter = { sort, search: search || undefined };
    if (selection.kind === "smart") return { ...base, view: selection.id };
    return { ...base, listId: selection.id };
  }, [selection, sort, search]);

  const { data, isLoading } = useTasks(filter);
  const tasks = useMemo(() => data?.tasks ?? [], [data]);

  const title =
    selection.kind === "smart"
      ? SMART_LISTS.find((s) => s.id === selection.id)?.name ?? "Tasks"
      : lists.find((l) => l.id === selection.id)?.name ?? "List";

  const activeListId = selection.kind === "list" ? selection.id : null;
  const openTask: TaskDTO | null = openId
    ? tasks.find((t) => t.id === openId) ?? null
    : null;

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:gap-8">
      <TaskSidebar lists={lists} selection={selection} onSelect={setSelection} />

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-display !text-2xl">{title}</h2>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-line bg-panel p-0.5">
              {VIEW_MODES.map((vm) => {
                const Icon = vm.icon;
                return (
                  <button
                    key={vm.id}
                    onClick={() => setViewMode(vm.id)}
                    title={vm.label}
                    className={cn(
                      "flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-small font-medium transition-colors",
                      viewMode === vm.id ? "bg-accent-muted text-accent" : "text-muted hover:text-fg",
                    )}
                  >
                    <Icon className="size-4" />
                    <span className="hidden sm:inline">{vm.label}</span>
                  </button>
                );
              })}
            </div>

            {viewMode !== "calendar" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex h-9 items-center gap-1.5 rounded-md border border-line bg-panel px-2.5 text-small text-muted hover:text-fg"
                    title="Sort"
                  >
                    <ArrowUpDown className="size-3.5" />
                    <span className="hidden sm:inline">{SORT_LABELS[sort]}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {(Object.keys(SORT_LABELS) as Sort[]).map((s) => (
                    <DropdownMenuItem key={s} onSelect={() => setSort(s)}>
                      {SORT_LABELS[s]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="flex h-9 items-center gap-2 rounded-md border border-line bg-panel px-3">
          <Search className="size-4 text-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter tasks…"
            className="flex-1 bg-transparent text-small text-fg outline-none placeholder:text-faint"
          />
        </div>

        {/* Quick add (hidden in the Completed smart list) */}
        {!(selection.kind === "smart" && selection.id === "completed") && (
          <QuickAddBar
            listId={activeListId}
            defaultFlagged={selection.kind === "smart" && selection.id === "flagged"}
          />
        )}

        {/* Main view */}
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={<ListTodo />}
            title="Nothing on your list yet"
            description="Add tasks to stay on top of what matters. Use the bar above — natural language works."
          />
        ) : viewMode === "list" ? (
          <TaskListView tasks={tasks} onOpen={(t) => setOpenId(t.id)} />
        ) : viewMode === "board" ? (
          <TaskBoardView tasks={tasks} onOpen={(t) => setOpenId(t.id)} />
        ) : (
          <TaskCalendarView tasks={tasks} onOpen={(t) => setOpenId(t.id)} />
        )}
      </div>

      <TaskDetailDialog
        task={openTask}
        lists={lists}
        open={openId !== null}
        onOpenChange={(v) => !v && setOpenId(null)}
      />
    </div>
  );
}
