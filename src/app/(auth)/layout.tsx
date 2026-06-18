import { Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-12">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-md bg-accent-gradient text-accent-contrast">
          <Sparkles className="size-4" />
        </div>
        <span className="text-heading">Nexus</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
      <p className="mt-8 text-small text-faint">
        Your day, your way — built up from scratch.
      </p>
    </div>
  );
}
