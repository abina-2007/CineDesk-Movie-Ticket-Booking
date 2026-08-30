import type { Booking, BookingStatus, Show, ShowType, SlaStatus, Stage } from "./types";

/* ---------------------------- Cost calculation ---------------------------- */

export function calculateTotalCost(numberOfTickets: number, ticketPrice: number): number {
  const tickets = Number.isFinite(numberOfTickets) ? Math.max(0, Math.floor(numberOfTickets)) : 0;
  const price = Number.isFinite(ticketPrice) ? Math.max(0, ticketPrice) : 0;
  return tickets * price;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

/* ------------------------------- Availability ----------------------------- */

export interface AvailabilityResult {
  available: boolean;
  availableSeats: number;
  requestedTickets: number;
  message: string;
}

export const NOT_ENOUGH_SEATS_MESSAGE = "Not enough seats available for this show.";

export function checkAvailability(show: Show | undefined, requestedTickets: number): AvailabilityResult {
  if (!show) {
    return {
      available: false,
      availableSeats: 0,
      requestedTickets,
      message: "Please select a show to check availability.",
    };
  }
  if (show.status === "Cancelled") {
    return {
      available: false,
      availableSeats: show.availableSeats,
      requestedTickets,
      message: "This show has been cancelled.",
    };
  }
  if (requestedTickets < 1) {
    return {
      available: false,
      availableSeats: show.availableSeats,
      requestedTickets,
      message: "Number of tickets must be at least 1.",
    };
  }
  if (requestedTickets > show.availableSeats) {
    return {
      available: false,
      availableSeats: show.availableSeats,
      requestedTickets,
      message: NOT_ENOUGH_SEATS_MESSAGE,
    };
  }
  return {
    available: true,
    availableSeats: show.availableSeats,
    requestedTickets,
    message: `${requestedTickets} seat(s) available and held for this request.`,
  };
}

/* --------------------------------- Routing -------------------------------- */

export function routeByShowType(showType: ShowType): string {
  return showType === "Premium" ? "Premium ShowQueue" : "Standard ShowQueue";
}

/* ----------------------------------- SLA ---------------------------------- */

export const SLA_GOAL_HOURS = 24; // 1 day
export const SLA_DEADLINE_HOURS = 48; // 2 days

export interface SlaInfo {
  goalDate: Date;
  deadlineDate: Date;
  status: SlaStatus;
  remainingMs: number;
  remainingLabel: string;
  percentElapsed: number;
}

export function getSlaInfo(booking: Booking, now: Date = new Date()): SlaInfo {
  const created = new Date(booking.createdDate);
  const goalDate = new Date(created.getTime() + SLA_GOAL_HOURS * 3600_000);
  const deadlineDate = new Date(created.getTime() + SLA_DEADLINE_HOURS * 3600_000);
  const resolved = booking.resolvedDate ? new Date(booking.resolvedDate) : null;
  const reference = resolved ?? now;
  const remainingMs = deadlineDate.getTime() - reference.getTime();

  let status: SlaStatus;
  if (isResolvedStatus(booking.bookingStatus)) {
    status = "Completed";
  } else if (reference > deadlineDate) {
    status = "SLA Breached";
  } else if (reference > goalDate) {
    status = "Approaching Deadline";
  } else {
    status = "Within SLA";
  }

  const total = deadlineDate.getTime() - created.getTime();
  const percentElapsed = Math.min(100, Math.max(0, ((reference.getTime() - created.getTime()) / total) * 100));

  return {
    goalDate,
    deadlineDate,
    status,
    remainingMs,
    remainingLabel: formatDuration(remainingMs),
    percentElapsed,
  };
}

export function formatDuration(ms: number): string {
  const overdue = ms < 0;
  const abs = Math.abs(ms);
  const hours = Math.floor(abs / 3600_000);
  const minutes = Math.floor((abs % 3600_000) / 60_000);
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  const parts = days > 0 ? `${days}d ${remHours}h` : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  return overdue ? `${parts} overdue` : parts;
}

export function isResolvedStatus(status: BookingStatus): boolean {
  return status === "Confirmed" || status === "Rejected" || status === "Cancelled";
}

/* --------------------------------- Stages --------------------------------- */

export function stageForStatus(status: BookingStatus): Stage {
  switch (status) {
    case "Draft":
    case "Submitted":
      return "Initial";
    case "Availability Check":
      return "Availability";
    case "Pending Approval":
    case "Approved":
      return "Approval";
    default:
      return "Booking Execution";
  }
}

/* ------------------------------- ID helpers ------------------------------- */

export function nextSequentialId(prefix: string, existing: string[]): string {
  const numbers = existing
    .map((id) => Number(id.replace(/\D/g, "")))
    .filter((n) => Number.isFinite(n));
  const next = (numbers.length ? Math.max(...numbers) : 0) + 1;
  return `${prefix}-${String(next).padStart(4, "0")}`;
}

/* ------------------------------- Formatting ------------------------------- */

export function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatTime(time: string): string {
  const parts = time.split(":").map(Number);
  const h = parts[0] ?? NaN;
  const m = parts[1] ?? 0;
  if (Number.isNaN(h)) return time;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
