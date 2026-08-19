import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-border bg-surface/60 px-6 py-4">
      <div className="mr-4 shrink-0">
        <h1 className="text-[15px] font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {children ? <div className="flex flex-1 items-center min-w-0">{children}</div> : <div className="flex-1" />}
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}