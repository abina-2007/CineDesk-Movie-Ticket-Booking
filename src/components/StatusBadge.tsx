import { cn } from "@/lib/utils";
import type { BookingStatus, ShowType, SlaStatus } from "@/lib/types";

type Tone = "neutral" | "gold" | "success" | "warning" | "info" | "danger" | "premium";

const toneClass: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  gold: "bg-primary/15 text-primary border-primary/30",
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  info: "bg-info/15 text-info border-info/30",
  danger: "bg-destructive/15 text-destructive border-destructive/35",
  premium: "bg-premium/15 text-premium border-premium/30",
};

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone | undefined;
  className?: string | undefined;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const statusTone: Record<BookingStatus, Tone> = {
  Draft: "neutral",
  Submitted: "info",
  "Availability Check": "info",
  "Pending Approval": "warning",
  Approved: "gold",
  "Booking Processing": "gold",
  Confirmed: "success",
  Rejected: "danger",
  Cancelled: "danger",
};

export function BookingStatusBadge({ status, className }: { status: BookingStatus; className?: string | undefined }) {
  return (
    <Pill tone={statusTone[status]} className={className}>
      {status}
    </Pill>
  );
}

const slaTone: Record<SlaStatus, Tone> = {
  "Within SLA": "success",
  "Approaching Deadline": "warning",
  "SLA Breached": "danger",
  Completed: "info",
};

export function SlaBadge({ status, className }: { status: SlaStatus; className?: string | undefined }) {
  return (
    <Pill tone={slaTone[status]} className={className}>
      {status}
    </Pill>
  );
}

export function ShowTypeBadge({ type, className }: { type: ShowType; className?: string | undefined }) {
  return (
    <Pill tone={type === "Premium" ? "premium" : "info"} className={className}>
      {type}
    </Pill>
  );
}

export function QueueBadge({ queue, className }: { queue: string; className?: string | undefined }) {
  return (
    <Pill tone={queue.startsWith("Premium") ? "premium" : "info"} className={className}>
      {queue}
    </Pill>
  );
}
