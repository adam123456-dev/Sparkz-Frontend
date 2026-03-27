import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background-light text-slate-900">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
            <span className="material-symbols-outlined">bolt</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight">Sparkz</h1>
        </div>
        <p className="text-sm text-slate-500">Disclosure Automation MVP</p>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}
