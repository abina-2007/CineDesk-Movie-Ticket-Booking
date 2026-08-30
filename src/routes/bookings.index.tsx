import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Crown,
  Eye,
  Filter,
  Hourglass,
  PlusCircle,
  Search,
  Ticket,
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { BookingStatusBadge, QueueBadge, ShowTypeBadge, SlaBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { formatCurrency, formatDate, formatTime, getSlaInfo } from "@/lib/booking-logic";
import type { BookingStatus } from "@/lib/types";

export const Route = createFileRoute("/bookings/")({
  head: () => ({
    meta: [
      { title: "My Bookings — CineDesk Booking Management" },
      {
        name: "description",
        content: "Track movie ticket booking requests, case workflow stages, SLA health and confirmation status.",
      },
      { property: "og:title", content: "My Bookings — CineDesk" },
      {
        property: "og:description",
        content: "Track movie ticket booking requests, queue assignments and SLA statuses.",
      },
    ],
  }),
  component: BookingsList,
});

function BookingsList() {
  const { bookings } = useStore();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [queueFilter, setQueueFilter] = useState<string>("all");
  const [slaFilter, setSlaFilter] = useState<string>("all");

  const pendingCount = bookings.filter((b) =>
    ["Submitted", "Availability Check", "Pending Approval", "Approved", "Booking Processing"].includes(
      b.bookingStatus,
    ),
  ).length;
  const confirmedCount = bookings.filter((b) => b.bookingStatus === "Confirmed").length;
  const breachedCount = bookings.filter((b) => getSlaInfo(b).status === "SLA Breached").length;

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const q = query.trim().toLowerCase();
      const matchQuery =
        !q ||
        b.requestId.toLowerCase().includes(q) ||
        (b.bookingId && b.bookingId.toLowerCase().includes(q)) ||
        b.customerName.toLowerCase().includes(q) ||
        b.customerEmail.toLowerCase().includes(q) ||
        b.movieName.toLowerCase().includes(q) ||
        b.theatre.toLowerCase().includes(q);

      let matchStatus = true;
      if (statusFilter === "pending") {
        matchStatus = ["Submitted", "Availability Check", "Pending Approval", "Approved", "Booking Processing"].includes(
          b.bookingStatus,
        );
      } else if (statusFilter === "resolved") {
        matchStatus = ["Confirmed", "Rejected", "Cancelled"].includes(b.bookingStatus);
      } else if (statusFilter !== "all") {
        matchStatus = b.bookingStatus === statusFilter;
      }

      const matchQueue = queueFilter === "all" || b.assignedQueue === queueFilter;

      const sla = getSlaInfo(b);
      const matchSla = slaFilter === "all" || sla.status === slaFilter;

      return matchQuery && matchStatus && matchQueue && matchSla;
    });
  }, [bookings, query, statusFilter, queueFilter, slaFilter]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Movie Ticket Requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track all submitted booking requests, queue assignments, SLA deadlines and stage progress.
          </p>
        </div>
        <Button asChild size="lg">
          <Link to="/book">
            <PlusCircle className="size-4" /> New Ticket Request
          </Link>
        </Button>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total requests"
          value={bookings.length}
          icon={<Ticket className="size-5" />}
          hint="All time"
        />
        <StatCard
          label="In progress"
          value={pendingCount}
          tone="warning"
          icon={<Hourglass className="size-5" />}
          hint="Active stages"
        />
        <StatCard
          label="Confirmed"
          value={confirmedCount}
          tone="success"
          icon={<CheckCircle2 className="size-5" />}
          hint="Booking execution complete"
        />
        <StatCard
          label="SLA Breached"
          value={breachedCount}
          tone="danger"
          icon={<Clock className="size-5" />}
          hint="Over 48h deadline"
        />
      </section>

      {/* Filters */}
      <section className="surface-panel mt-6 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ID, customer, movie..."
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">All Pending Stages</SelectItem>
              <SelectItem value="Submitted">Submitted (Initial)</SelectItem>
              <SelectItem value="Availability Check">Availability Check</SelectItem>
              <SelectItem value="Pending Approval">Pending Approval</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Confirmed">Confirmed</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={queueFilter} onValueChange={setQueueFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Assigned Queue" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Queues</SelectItem>
              <SelectItem value="Premium ShowQueue">Premium ShowQueue</SelectItem>
              <SelectItem value="Standard ShowQueue">Standard ShowQueue</SelectItem>
            </SelectContent>
          </Select>

          <Select value={slaFilter} onValueChange={setSlaFilter}>
            <SelectTrigger>
              <SelectValue placeholder="SLA Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All SLA Statuses</SelectItem>
              <SelectItem value="Within SLA">Within SLA (&lt; 24h)</SelectItem>
              <SelectItem value="Approaching Deadline">Approaching Deadline (24h - 48h)</SelectItem>
              <SelectItem value="SLA Breached">SLA Breached (&gt; 48h)</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Bookings List */}
      <section className="surface-panel mt-6 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Filter className="size-6" />}
              title="No requests match your filters"
              description="Try adjusting your search or clearing active filters."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery("");
                    setStatusFilter("all");
                    setQueueFilter("all");
                    setSlaFilter("all");
                  }}
                >
                  Clear all filters
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-secondary/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3.5">Request / ID</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Movie &amp; Show</th>
                  <th className="px-4 py-3.5">Queue / Type</th>
                  <th className="px-4 py-3.5">Tickets &amp; Total</th>
                  <th className="px-4 py-3.5">Status &amp; Stage</th>
                  <th className="px-4 py-3.5">SLA</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((b) => {
                  const sla = getSlaInfo(b);
                  return (
                    <tr key={b.requestId} className="transition-colors hover:bg-secondary/30">
                      <td className="whitespace-nowrap px-4 py-4">
                        <p className="font-mono font-bold text-primary">{b.requestId}</p>
                        {b.bookingId && (
                          <p className="mt-0.5 font-mono text-xs text-success font-semibold">{b.bookingId}</p>
                        )}
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {formatDate(b.createdDate.slice(0, 10))}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-foreground">{b.customerName}</p>
                        <p className="text-xs text-muted-foreground">{b.customerEmail}</p>
                        <p className="text-xs text-muted-foreground">{b.customerPhone}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-foreground">{b.movieName}</p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="size-3" /> {formatDate(b.showDate)} · {formatTime(b.showTime)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {b.theatre} ({b.screen})
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="space-y-1">
                          <div>
                            <ShowTypeBadge type={b.showType} />
                          </div>
                          <div>
                            <QueueBadge queue={b.assignedQueue} />
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <p className="font-medium text-foreground">{b.numberOfTickets} ticket(s)</p>
                        <p className="font-mono text-xs text-primary font-semibold">
                          {formatCurrency(b.totalCost)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          @{formatCurrency(b.ticketPrice)}/ea
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="space-y-1">
                          <div>
                            <BookingStatusBadge status={b.bookingStatus} />
                          </div>
                          <p className="text-[11px] text-muted-foreground font-medium">
                            Stage: {b.stage}
                          </p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="space-y-1">
                          <SlaBadge status={sla.status} />
                          <p className="text-[11px] text-muted-foreground">
                            {sla.status === "Completed" ? "Completed" : sla.remainingLabel}
                          </p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link to="/bookings/$requestId" params={{ requestId: b.requestId }}>
                            <Eye className="size-3.5" /> Details
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
