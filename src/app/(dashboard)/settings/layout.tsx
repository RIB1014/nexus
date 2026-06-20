import { SettingsNav } from "@/components/settings/SettingsNav";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-display !text-2xl">Settings</h2>
        <p className="mt-1 text-body text-muted">
          Tune Orbit to fit exactly how you work.
        </p>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
        <SettingsNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
