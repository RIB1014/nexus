import { isSameDay, parseISO } from "date-fns";
import { ListTodo, CalendarDays, Repeat, Flame } from "lucide-react";
import type { DashboardData } from "@/lib/data/dashboard";
import { moduleColor } from "@/lib/modules/colors";
import { ColorIcon } from "@/components/ui/color-picker";

/**
 * "Today at a glance" — a compact strip of live stat tiles pulled from the
 * user's real data. Only shows tiles for modules that are enabled.
 */
export function StatStrip({
  data,
  enabledModuleIds,
}: {
  data: DashboardData;
  enabledModuleIds: string[];
}) {
  const has = (id: string) => enabledModuleIds.includes(id);
  const eventsToday = data.events.items.filter((e) =>
    isSameDay(parseISO(e.start), new Date()),
  ).length;

  const tiles: { id: string; icon: typeof ListTodo; value: string; label: string; color: string }[] = [];
  if (has("tasks"))
    tiles.push({
      id: "tasks",
      icon: ListTodo,
      value: String(data.tasks.remaining),
      label: data.tasks.remaining === 1 ? "task due" : "tasks due",
      color: moduleColor("tasks"),
    });
  if (has("calendar"))
    tiles.push({
      id: "calendar",
      icon: CalendarDays,
      value: String(eventsToday),
      label: eventsToday === 1 ? "event today" : "events today",
      color: moduleColor("calendar"),
    });
  if (has("habits"))
    tiles.push({
      id: "habits",
      icon: Repeat,
      value: `${data.habits.completedToday}/${data.habits.items.length}`,
      label: "habits done",
      color: moduleColor("habits"),
    });
  if (has("practice-log"))
    tiles.push({
      id: "practice",
      icon: Flame,
      value: String(data.practice.streak),
      label: data.practice.streak === 1 ? "day streak" : "day streak",
      color: moduleColor("practice-log"),
    });

  if (tiles.length === 0) return null;

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((t) => {
        const Icon = t.icon;
        return (
          <div
            key={t.id}
            className="app-card flex items-center gap-3 p-3.5"
            style={{ borderTopColor: t.color, borderTopWidth: 2 }}
          >
            <ColorIcon color={t.color} className="size-10 [&_svg]:size-5">
              <Icon />
            </ColorIcon>
            <div className="min-w-0">
              <div className="text-2xl font-bold leading-none text-fg">{t.value}</div>
              <div className="mt-1 truncate text-small text-muted">{t.label}</div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
