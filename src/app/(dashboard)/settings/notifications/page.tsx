import { EmptyState } from "@/components/ui/empty-state";
import { Bell } from "lucide-react";

export default function NotificationsSettings() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-body text-muted">
        Nexus never spams you — reminders are in-app and only for the modules
        you&apos;ve enabled.
      </p>
      <EmptyState
        icon={<Bell />}
        title="Notification preferences are on the way"
        description="Per-module reminders — task due-soon alerts, habit check-ins, and academic deadlines — will be configurable here as each module ships."
      />
    </div>
  );
}
