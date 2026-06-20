import { BrandMark } from "@/components/layout/BrandMark";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-12">
      <div className="mb-8 flex items-center gap-2.5">
        <BrandMark />
        <span className="text-[1.35rem] font-semibold tracking-[-0.02em]">Orbit</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
      <p className="mt-8 text-small text-faint">
        Your day, your way — built up from scratch.
      </p>
    </div>
  );
}
