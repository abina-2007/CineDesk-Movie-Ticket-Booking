import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  hint?: string | undefined;
  tone?: "default" | "success" | "warning" | "danger" | "premium" | "info" | undefined;
}) {
  const toneRing: Record<string, string> = {
    default: "text-primary bg-primary/15",
    success: "text-success bg-success/15",
    warning: "text-warning bg-warning/15",
    danger: "text-destructive bg-destructive/15",
    premium: "text-premium bg-premium/15",
    info: "text-info bg-info/15",
  };

  return (
    <div className="surface-panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <span className={cn("flex size-10 items-center justify-center rounded-lg", toneRing[tone])}>{icon}</span>
      </div>
    </div>
  );
}
