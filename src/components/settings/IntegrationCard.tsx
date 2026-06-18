"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IntegrationAdapter } from "@/types/integration";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Connection {
  status: string;
  lastSyncedAt: string | null;
  accountEmail: string | null;
  errorMessage: string | null;
}

const STATUS_DOT: Record<string, string> = {
  connected: "bg-green-500",
  error: "bg-red-500",
  disconnected: "bg-line-strong",
};

export function IntegrationCard({
  integration,
  connection,
}: {
  integration: IntegrationAdapter;
  connection: Connection | null;
}) {
  const status = integration.comingSoon
    ? "coming-soon"
    : connection?.status ?? "disconnected";
  const connected = status === "connected";

  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <div className="flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-inset text-xl">
          {integration.icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-small font-semibold text-fg">
              {integration.name}
            </h3>
            {integration.comingSoon ? (
              <Badge>Coming soon</Badge>
            ) : (
              <span className="flex items-center gap-1.5 text-small text-muted">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    STATUS_DOT[status] ?? "bg-line-strong",
                  )}
                />
                {connected
                  ? "Connected"
                  : status === "error"
                    ? "Error"
                    : "Not connected"}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-small text-muted">
            {integration.description}
          </p>

          {connected && connection?.accountEmail && (
            <p className="mt-1 text-small text-muted">
              Signed in as{" "}
              <span className="text-fg">{connection.accountEmail}</span>
            </p>
          )}
          {status === "error" && connection?.errorMessage && (
            <p className="mt-1 text-small text-red-600 dark:text-red-400">
              {connection.errorMessage}
            </p>
          )}

          {/* Permissions */}
          <ul className="mt-3 flex flex-col gap-1">
            {integration.permissions.map((p) => (
              <li
                key={p}
                className="flex items-center gap-2 text-small text-muted"
              >
                <Check className="size-3.5 text-accent" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="shrink-0">
          {integration.comingSoon ? (
            <Button variant="secondary" size="sm" disabled>
              Coming soon
            </Button>
          ) : connected ? (
            <Button variant="outline" size="sm" disabled title="Wiring lands with the integration deliverable">
              Disconnect
            </Button>
          ) : (
            <Button
              size="sm"
              disabled
              title="Connecting lands with the integration deliverable"
            >
              Connect
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
