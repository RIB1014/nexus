"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ListTodo, LayoutGrid, CalendarDays, Search, ArrowUpDown,
  SlidersHorizontal, CheckSquare, X, Trash2, Flag, CheckCircle2, FolderInput,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useTasks, useTaskLists, useTaskTags, useUpdateTask, useDeleteTask, type TaskFilter,
} from "@/lib/hooks/useTasks";
import type { TaskDTO } from "@/types/task";
import { SMART_LISTS, PRIORITY_META, type Priority } from "@/types/task";
import { TaskSidebar, type Selection } from "./TaskSidebar";
import { QuickAddBar } from "./QuickAddBar";
import { TaskListView } from "./TaskListView";
import { TaskBoardView } from "./TaskBoardView";
import { TaskCalendarView } from "./TaskCalendarView";
import { TaskDetailDialog } from "./TaskDetailDialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ViewMode = "list" | "board" | "calendar";
type Sort = "due" | "priority" | "created" | "manual";

const SORT_LABELS: Record<Sort, string> = {
  due: "Due date", priority: "Priority", created: "Recently added", manual: "Manual",
};
const VIEW_MODES: { id: ViewMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "list", label: "List", icon: ListTodo },
  { id: "board", label: "Board", icon: LayoutGrid },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
];
const PRIORITIES: Priority[] = ["urgent", "high", "medium", "low", "none"];

export function TasksModule() {
  const { data: listsData } = useTaskLists();
  const { data: tagsData } = useTaskTags();
  const lists = useMemo(() => listsData?.lists ?? [], [listsData]);
  const allTags = useMemo(() => tagsData?.tags ?? [], [tagsData]);
  const update = useUpdateTask();
  const del = useDeleteTask();

  const [selection, setSelection] = useState<Selection>({ kind: "smart", id: "today" });
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sort, setSort] = useState<Sort>("due");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<Priority | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filter: TaskFilter = useMemo(() => {
    const base: TaskFilter = { sort, search: search || undefined };
    if (selection.kind === "smart") return { ...base, view: selection.id };
    return { ...base, listId: selection.id };
  }, [selection, sort, search]);

  const { data, isLoading } = useTasks(filter);
  const rawTasks = useMemo(() => data?.tasks ?? [], [data]);

  const tasks = useMemo(() => rawTasks.filter((t) => {
    if (priorityFilter && t.priority !== priorityFilter) return false;
    if (tagFilter && !t.tags.some((x) => x.name === tagFilter)) return false;
    return true;
  }), [rawTasks, priorityFilter, tagFilter]);

  // Keyboard: N focuses quick-add (when not typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        document.getElementById("quick-add-input")?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const title = selection.kind === "smart"
    ? SMART_LISTS.find((s) => s.id === selection.id)?.name ?? "Tasks"
    : lists.find((l) => l.id === selection.id)?.name ?? "List";

  const activeListId = selection.kind === "list" ? selection.id : null;
  const openTask: TaskDTO | null = openId ? tasks.find((t) => t.id === openId) ?? null : null;

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  const clearSelection = () => { setSelected(new Set()); setSelectionMode(false); };
  const bulk = (fn: (id: string) => void) => { selected.forEach(fn); clearSelection(); };

  const hasFilters = priorityFilter || tagFilter;

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
                  <button key={vm.id} onClick={() => setViewMode(vm.id)} title={vm.label}
                    className={cn("flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-small font-medium transition-colors",
                      viewMode === vm.id ? "bg-accent-muted text-accent" : "text-muted hover:text-fg")}>
                    <Icon className="size-4" /><span className="hidden sm:inline">{vm.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Filters */}
            {viewMode !== "calendar" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button title="Filter"
                    className={cn("flex h-9 items-center gap-1.5 rounded-md border px-2.5 text-small transition-colors",
                      hasFilters ? "border-accent bg-accent-muted text-accent" : "border-line bg-panel text-muted hover:text-fg")}>
                    <SlidersHorizontal className="size-3.5" />
                    <span className="hidden sm:inline">{hasFilters ? "Filtered" : "Filter"}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>Priority</DropdownMenuLabel>
                  {PRIORITIES.map((p) => (
                    <DropdownMenuItem key={p} onSelect={() => setPriorityFilter(priorityFilter === p ? null : p)}>
                      <span className="size-2 rounded-full" style={{ background: PRIORITY_META[p].color === "transparent" ? "var(--color-border-strong)" : PRIORITY_META[p].color }} />
                      {PRIORITY_META[p].label}
                      {priorityFilter === p && <CheckCircle2 className="ml-auto size-3.5 text-accent" />}
                    </DropdownMenuItem>
                  ))}
                  {allTags.length > 0 && <><DropdownMenuSeparator /><DropdownMenuLabel>Tag</DropdownMenuLabel></>}
                  {allTags.map((t) => (
                    <DropdownMenuItem key={t.id} onSelect={() => setTagFilter(tagFilter === t.name ? null : t.name)}>
                      <span className="size-2 rounded-full" style={{ background: t.color }} />
                      {t.name}
                      {tagFilter === t.name && <CheckCircle2 className="ml-auto size-3.5 text-accent" />}
                    </DropdownMenuItem>
                  ))}
                  {hasFilters && <><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => { setPriorityFilter(null); setTagFilter(null); }}>Clear filters</DropdownMenuItem></>}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Sort */}
            {viewMode !== "calendar" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-9 items-center gap-1.5 rounded-md border border-line bg-panel px-2.5 text-small text-muted hover:text-fg" title="Sort">
                    <ArrowUpDown className="size-3.5" /><span className="hidden sm:inline">{SORT_LABELS[sort]}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {(Object.keys(SORT_LABELS) as Sort[]).map((s) => (
                    <DropdownMenuItem key={s} onSelect={() => setSort(s)}>{SORT_LABELS[s]}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Select */}
            {viewMode === "list" && (
              <button
                onClick={() => { setSelectionMode((v) => !v); setSelected(new Set()); }}
                className={cn("flex h-9 items-center gap-1.5 rounded-md border px-2.5 text-small transition-colors",
                  selectionMode ? "border-accent bg-accent-muted text-accent" : "border-line bg-panel text-muted hover:text-fg")}
                title="Select multiple">
                <CheckSquare className="size-3.5" /><span className="hidden sm:inline">Select</span>
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="flex h-9 items-center gap-2 rounded-md border border-line bg-panel px-3">
          <Search className="size-4 text-faint" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter tasks…"
            className="flex-1 bg-transparent text-small text-fg outline-none placeholder:text-faint" />
        </div>

        {/* Bulk action bar */}
        {selectionMode && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-accent/40 bg-accent-muted/40 px-3 py-2">
            <span className="text-small font-medium text-fg">{selected.size} selected</span>
            <div className="flex-1" />
            <Button size="sm" variant="secondary" disabled={!selected.size} onClick={() => bulk((id) => update.mutate({ id, patch: { completed: true } }))}><CheckCircle2 /> Complete</Button>
            <Button size="sm" variant="secondary" disabled={!selected.size} onClick={() => bulk((id) => update.mutate({ id, patch: { flagged: true } }))}><Flag /> Flag</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="secondary" disabled={!selected.size}>Priority</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {PRIORITIES.map((p) => (
                  <DropdownMenuItem key={p} onSelect={() => bulk((id) => update.mutate({ id, patch: { priority: p } }))}>{PRIORITY_META[p].label}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {lists.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="secondary" disabled={!selected.size}><FolderInput /> Move</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {lists.map((l) => (
                    <DropdownMenuItem key={l.id} onSelect={() => bulk((id) => update.mutate({ id, patch: { listId: l.id } }))}>{l.icon ? `${l.icon} ` : ""}{l.name}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-500/10" disabled={!selected.size} onClick={() => bulk((id) => del.mutate(id))}><Trash2 /> Delete</Button>
            <Button size="sm" variant="ghost" onClick={clearSelection}><X /></Button>
          </div>
        )}

        {/* Quick add */}
        {!(selection.kind === "smart" && selection.id === "completed") && !selectionMode && (
          <QuickAddBar listId={activeListId} defaultFlagged={selection.kind === "smart" && selection.id === "flagged"} />
        )}

        {/* Main view */}
        {isLoading ? (
          <div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : tasks.length === 0 ? (
          <EmptyState icon={<ListTodo />} title={hasFilters ? "No tasks match your filters" : "Nothing on your list yet"}
            description={hasFilters ? "Try clearing a filter to see more." : "Add tasks to stay on top of what matters. Natural language works — try “every week”."} />
        ) : viewMode === "list" ? (
          <TaskListView tasks={tasks} onOpen={(t) => setOpenId(t.id)} selectionMode={selectionMode} selected={selected} onToggleSelect={toggleSelect} />
        ) : viewMode === "board" ? (
          <TaskBoardView tasks={tasks} onOpen={(t) => setOpenId(t.id)} />
        ) : (
          <TaskCalendarView tasks={tasks} onOpen={(t) => setOpenId(t.id)} />
        )}
      </div>

      <TaskDetailDialog task={openTask} lists={lists} open={openId !== null} onOpenChange={(v) => !v && setOpenId(null)} />
    </div>
  );
}
