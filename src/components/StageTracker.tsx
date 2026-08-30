import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { STAGES, type Stage } from "@/lib/types";

export function StageTracker({
  current,
  failed = false,
  className,
}: {
  current: Stage;
  failed?: boolean | undefined;
  className?: string | undefined;
}) {
  const currentIndex = STAGES.indexOf(current);

  return (
    <ol className={cn("flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-0", className)}>
      {STAGES.map((stage, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li key={stage} className="flex flex-1 items-center gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  done && "border-success/40 bg-success/20 text-success",
                  active && !failed && "border-primary bg-primary text-primary-foreground shadow-marquee",
                  active && failed && "border-destructive bg-destructive/20 text-destructive",
                  !done && !active && "border-border bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  active ? "text-foreground" : done ? "text-success" : "text-muted-foreground",
                )}
              >
                {stage}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <span
                className={cn(
                  "ml-1 hidden h-px flex-1 sm:block",
                  i < currentIndex ? "bg-success/50" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
