import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlarmClock,
  BadgeCheck,
  CalendarDays,
  Clapperboard,
  CircleSlash,
  Crown,
  Hourglass,
  Ticket,
  TrendingUp,
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { BookingStatusBadge, Pill, QueueBadge, SlaBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { formatCurrency, formatDate, formatTime, getSlaInfo } from "@/lib/booking-logic";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CineDesk Dashboard — Movie Ticket Booking Management" },
      {
        name: "description",
        content:
          "Operations dashboard for the Movie Ticket Request case: bookings, SLA health, queue routing and stage progress.",
      },
      { property: "og:title", content: "CineDesk Dashboard — Movie Ticket Booking Management" },
      {
        property: "og:description",
        content: "Track movie ticket requests across Initial, Availability, Approval and Booking Execution stages.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { bookings, movies, shows } = useStore();

  const total = bookings.length;
  const pending = bookings.filter((b) =>
    ["Submitted", "Availability Check", "Pending Approval", "Approved", "Booking Processing"].includes(
      b.bookingStatus,
    ),
  ).length;
  const confirmed = bookings.filter((b) => b.bookingStatus === "Confirmed").length;
  const cancelled = bookings.filter((b) => b.bookingStatus === "Cancelled" || b.bookingStatus === "Rejected").length;
  const breached = bookings.filter((b) => getSlaInfo(b).status === "SLA Breached").length;
  const premium = bookings.filter((b) => b.showType === "Premium").length;
  const standard = bookings.filter((b) => b.showType === "Standard").length;
  const revenue = bookings
    .filter((b) => b.bookingStatus === "Confirmed")
    .reduce((sum, b) => sum + b.totalCost, 0);

  const recent = [...bookings]
    .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <section className="surface-panel relative overflow-hidden p-6 sm:p-9">
        <div className="relative z-10 max-w-2xl">
          <Pill tone="gold">
            <Clapperboard className="size-3.5" /> Movie Ticket Request · Case Management
          </Pill>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Booking operations <span className="text-marquee">command centre</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Submit, verify availability, approve and execute movie ticket bookings with automatic cost calculation,
            show-type queue routing and a 1-day goal / 2-day deadline SLA.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/book">Submit Ticket Request</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/movies">Browse Movie Catalogue</Link>
            </Button>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total bookings" value={total} icon={<Ticket className="size-5" />} hint="All requests" />
        <StatCard
          label="Pending requests"
          value={pending}
          tone="warning"
          icon={<Hourglass className="size-5" />}
          hint="In progress stages"
        />
        <StatCard
          label="Confirmed bookings"
          value={confirmed}
          tone="success"
          icon={<BadgeCheck className="size-5" />}
          hint={`${formatCurrency(revenue)} booked value`}
        />
        <StatCard
          label="Cancelled / rejected"
          value={cancelled}
          tone="danger"
          icon={<CircleSlash className="size-5" />}
          hint="Resolved unsuccessfully"
        />
        <StatCard
          label="SLA breached"
          value={breached}
          tone="danger"
          icon={<AlarmClock className="size-5" />}
          hint="Past 2-day deadline"
        />
        <StatCard
          label="Premium bookings"
          value={premium}
          tone="premium"
          icon={<Crown className="size-5" />}
          hint="Premium ShowQueue"
        />
        <StatCard
          label="Standard bookings"
          value={standard}
          tone="info"
          icon={<Ticket className="size-5" />}
          hint="Standard ShowQueue"
        />
        <StatCard
          label="Catalogue"
          value={`${movies.length} / ${shows.length}`}
          icon={<TrendingUp className="size-5" />}
          hint="Movies / shows"
        />
      </section>

      <section className="mt-8 surface-panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">Recent ticket requests</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin">Open admin dashboard</Link>
          </Button>
        </div>
        <ul className="divide-y divide-border">
          {recent.map((b) => {
            const sla = getSlaInfo(b);
            return (
              <li key={b.requestId}>
                <Link
                  to="/bookings/$requestId"
                  params={{ requestId: b.requestId }}
                  className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-secondary/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <span className="font-mono text-xs text-primary">{b.requestId}</span>
                      {b.movieName}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="size-3.5" />
                      {formatDate(b.showDate)} · {formatTime(b.showTime)} · {b.customerName} ·{" "}
                      {b.numberOfTickets} ticket(s) · {formatCurrency(b.totalCost)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <QueueBadge queue={b.assignedQueue} />
                    <SlaBadge status={sla.status} />
                    <BookingStatusBadge status={b.bookingStatus} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
