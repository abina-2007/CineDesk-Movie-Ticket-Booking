import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string | undefined;
  action?: React.ReactNode | undefined;
  icon?: React.ReactNode | undefined;
}) {
  return (
    <div className="surface-panel flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        {icon ?? <Inbox className="size-6" />}
      </span>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

export function LoadingState({ label = "Loading data…" }: { label?: string }) {
  return (
    <div className="surface-panel flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <span className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
