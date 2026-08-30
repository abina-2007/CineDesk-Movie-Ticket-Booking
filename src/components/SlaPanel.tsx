import { Clock, Flag, Timer } from "lucide-react";
import { SlaBadge } from "./StatusBadge";
import { Progress } from "@/components/ui/progress";
import { getSlaInfo, formatDateTime, SLA_GOAL_HOURS, SLA_DEADLINE_HOURS } from "@/lib/booking-logic";
import type { Booking } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SlaPanel({ booking, className }: { booking: Booking; className?: string | undefined }) {
  const sla = getSlaInfo(booking);

  return (
    <div className={cn("surface-panel p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          <Timer className="size-4 text-primary" /> Booking SLA
        </h3>
        <SlaBadge status={sla.status} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <SlaCell
          icon={<Flag className="size-3.5" />}
          label={`SLA Goal (${SLA_GOAL_HOURS / 24} day)`}
          value={formatDateTime(sla.goalDate.toISOString())}
        />
        <SlaCell
          icon={<Clock className="size-3.5" />}
          label={`SLA Deadline (${SLA_DEADLINE_HOURS / 24} days)`}
          value={formatDateTime(sla.deadlineDate.toISOString())}
        />
        <SlaCell
          icon={<Timer className="size-3.5" />}
          label="Remaining time"
          value={sla.status === "Completed" ? "Resolved within case" : sla.remainingLabel}
        />
      </div>

      <Progress value={sla.percentElapsed} className="mt-4 h-2" />
      <p className="mt-2 text-xs text-muted-foreground">
        Elapsed since request creation ({formatDateTime(booking.createdDate)})
      </p>
    </div>
  );
}

function SlaCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
