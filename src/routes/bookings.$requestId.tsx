import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Film,
  Loader2,
  Mail,
  MapPin,
  Send,
  Ticket,
  User,
  XCircle,
} from "lucide-react";
import { StageTracker } from "@/components/StageTracker";
import { SlaPanel } from "@/components/SlaPanel";
import { BookingStatusBadge, Pill, QueueBadge, ShowTypeBadge, SlaBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import {
  checkAvailability,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatTime,
  getSlaInfo,
  isResolvedStatus,
} from "@/lib/booking-logic";

export const Route = createFileRoute("/bookings/$requestId")({
  head: ({ params }) => ({
    meta: [
      { title: `Booking Request ${params.requestId} — CineDesk` },
      {
        name: "description",
        content: `Case details, workflow stage, SLA health and execution for movie ticket request ${params.requestId}.`,
      },
      { property: "og:title", content: `Booking ${params.requestId} — CineDesk` },
      {
        property: "og:description",
        content: "Track and manage movie ticket request stages and approvals.",
      },
    ],
  }),
  component: BookingDetails,
});

function BookingDetails() {
  const { requestId } = Route.useParams();
  const navigate = useNavigate();
  const store = useStore();
  const booking = store.getBooking(requestId);
  const show = booking ? store.getShow(booking.showId) : undefined;
  const movie = booking ? store.getMovie(booking.movieId) : undefined;

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  if (!booking) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Booking request not found"
          description={`No booking request matching ID "${requestId}" was found.`}
          action={
            <Button asChild variant="outline">
              <Link to="/bookings">Back to all bookings</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const currentBooking = booking;
  const currentShow = store.getShow(currentBooking.showId);
  const sla = getSlaInfo(currentBooking);
  const availability = checkAvailability(currentShow, currentBooking.numberOfTickets);
  const resolved = isResolvedStatus(currentBooking.bookingStatus);
  const isFailed = currentBooking.bookingStatus === "Rejected" || currentBooking.bookingStatus === "Cancelled";

  function handleAdvanceToAvailability() {
    store.advanceToAvailability(currentBooking.requestId);
    toast.success(`Request ${currentBooking.requestId} advanced to Availability stage`);
  }

  function handleAdvanceToApproval() {
    if (!availability.available) {
      toast.error(availability.message);
      return;
    }
    store.advanceToApproval(currentBooking.requestId);
    toast.success(`Request ${currentBooking.requestId} advanced to Approval stage`, {
      description: `Routed to ${currentBooking.assignedQueue}`,
    });
  }

  function handleApprove() {
    store.approveBooking(currentBooking.requestId);
    toast.success(`Request ${currentBooking.requestId} approved`, {
      description: "Ready for Booking Execution.",
    });
  }

  function handleReject() {
    store.rejectBooking(currentBooking.requestId, rejectReason || "Rejected by administrator");
    setRejectOpen(false);
    setRejectReason("");
    toast.error(`Request ${currentBooking.requestId} rejected`);
  }

  function handleProcessBooking() {
    setProcessing(true);
    setTimeout(() => {
      const result = store.processBooking(currentBooking.requestId);
      setProcessing(false);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Booking executed & confirmed", {
        description: `Booking ID ${result.booking?.bookingId} generated. Available seats updated.`,
      });
    }, 1000);
  }

  function handleCancel() {
    store.cancelBooking(currentBooking.requestId);
    setCancelOpen(false);
    toast.info(`Request ${currentBooking.requestId} cancelled`);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/bookings">
            <ArrowLeft className="size-4" /> Back to My Bookings
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <ShowTypeBadge type={booking.showType} />
          <QueueBadge queue={booking.assignedQueue} />
          <SlaBadge status={sla.status} />
          <BookingStatusBadge status={booking.bookingStatus} />
        </div>
      </div>

      <header className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-baseline">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              Request <span className="font-mono text-primary">{booking.requestId}</span>
            </h1>
            {booking.bookingId && (
              <Pill tone="success" className="font-mono text-xs font-bold">
                {booking.bookingId}
              </Pill>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Created on {formatDateTime(booking.createdDate)} · Current Stage:{" "}
            <span className="font-semibold text-foreground">{booking.stage}</span>
          </p>
        </div>
      </header>

      {/* Case Stage Tracker */}
      <section className="surface-panel mt-6 p-5">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Business Workflow Progress
        </h2>
        <StageTracker current={booking.stage} failed={isFailed} />
      </section>

      {/* Workflow Action Bar */}
      {!resolved && (
        <section className="surface-panel mt-6 border-l-4 border-l-primary p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-base font-semibold">Stage Workflow Action Required</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {booking.bookingStatus === "Submitted" &&
                  "Request submitted in Initial stage. Advance to seat inventory check."}
                {booking.bookingStatus === "Availability Check" &&
                  "Verify show seat availability before routing to approval queue."}
                {booking.bookingStatus === "Pending Approval" &&
                  `Assigned to ${booking.assignedQueue}. Review customer request and approve or reject.`}
                {booking.bookingStatus === "Approved" &&
                  "Request is approved. Execute booking to deduct seats and generate Booking ID."}
                {booking.bookingStatus === "Booking Processing" && "Processing booking execution..."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {booking.bookingStatus === "Submitted" && (
                <Button onClick={handleAdvanceToAvailability}>
                  Advance to Availability Check <ArrowRight className="size-4" />
                </Button>
              )}

              {booking.bookingStatus === "Availability Check" && (
                <Button onClick={handleAdvanceToApproval} disabled={!availability.available}>
                  Proceed to Approval <ArrowRight className="size-4" />
                </Button>
              )}

              {booking.bookingStatus === "Pending Approval" && (
                <>
                  <Button onClick={handleApprove} className="bg-success text-success-foreground hover:bg-success/90">
                    <CheckCircle2 className="size-4" /> Approve
                  </Button>
                  <Button variant="destructive" onClick={() => setRejectOpen(true)}>
                    <XCircle className="size-4" /> Reject
                  </Button>
                </>
              )}

              {booking.bookingStatus === "Approved" && (
                <Button onClick={handleProcessBooking} disabled={processing || !availability.available}>
                  {processing ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Processing…
                    </>
                  ) : (
                    <>
                      <BadgeCheck className="size-4" /> Execute &amp; Confirm Booking
                    </>
                  )}
                </Button>
              )}

              <Button variant="outline" size="sm" onClick={() => setCancelOpen(true)}>
                Cancel Request
              </Button>
            </div>
          </div>

          {!availability.available && booking.bookingStatus !== "Confirmed" && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              <span>
                <strong>Warning:</strong> {availability.message} (Requested: {booking.numberOfTickets}, Available:{" "}
                {show?.availableSeats ?? 0})
              </span>
            </div>
          )}
        </section>
      )}

      {/* Details Grid */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Customer Information */}
        <section className="surface-panel p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <User className="size-4 text-primary" /> Customer Information
          </h2>
          <dl className="mt-4 divide-y divide-border text-sm">
            <div className="flex justify-between py-2.5">
              <dt className="text-muted-foreground">Customer Name</dt>
              <dd className="font-semibold text-foreground">{booking.customerName}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium text-foreground">{booking.customerEmail}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="font-mono text-foreground">{booking.customerPhone}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-muted-foreground">Assigned Queue</dt>
              <dd>
                <QueueBadge queue={booking.assignedQueue} />
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-muted-foreground">Confirmation Email</dt>
              <dd>
                <Pill tone={booking.confirmationStatus === "Sent" ? "success" : "neutral"}>
                  {booking.confirmationStatus}
                </Pill>
              </dd>
            </div>
          </dl>
        </section>

        {/* Movie & Show Information */}
        <section className="surface-panel p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Film className="size-4 text-primary" /> Movie &amp; Show Details
          </h2>
          <dl className="mt-4 divide-y divide-border text-sm">
            <div className="flex justify-between py-2.5">
              <dt className="text-muted-foreground">Movie</dt>
              <dd className="font-semibold text-foreground">
                <Link to="/movies/$movieId" params={{ movieId: booking.movieId }} className="hover:underline text-primary">
                  {booking.movieName}
                </Link>
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-muted-foreground">Theatre / Screen</dt>
              <dd className="font-medium text-foreground">
                {booking.theatre} · {booking.screen}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-muted-foreground">Show Date &amp; Time</dt>
              <dd className="font-semibold text-foreground">
                {formatDate(booking.showDate)} at {formatTime(booking.showTime)}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-muted-foreground">Show Type</dt>
              <dd>
                <ShowTypeBadge type={booking.showType} />
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-muted-foreground">Show Inventory</dt>
              <dd className="text-foreground">
                {show ? `${show.availableSeats} / ${show.totalSeats} seats available` : "—"}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {/* Financial & Pricing Breakdown */}
      <section className="surface-panel mt-6 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Ticket className="size-4 text-primary" /> Cost Calculation Breakdown
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-secondary/40 p-4">
            <p className="text-xs uppercase text-muted-foreground">Number of Tickets</p>
            <p className="mt-1 text-xl font-bold">{booking.numberOfTickets}</p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/40 p-4">
            <p className="text-xs uppercase text-muted-foreground">Ticket Price (Show Rate)</p>
            <p className="mt-1 text-xl font-bold">{formatCurrency(booking.ticketPrice)}</p>
          </div>
          <div className="rounded-lg border border-primary/40 bg-primary/10 p-4">
            <p className="text-xs uppercase text-primary font-semibold">Total Cost (Auto-calculated)</p>
            <p className="mt-1 text-2xl font-black text-primary">{formatCurrency(booking.totalCost)}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {booking.numberOfTickets} × {formatCurrency(booking.ticketPrice)}
            </p>
          </div>
        </div>
      </section>

      {/* SLA Section */}
      <div className="mt-6">
        <SlaPanel booking={booking} />
      </div>

      {/* Simulated Email Confirmation */}
      {booking.confirmationStatus === "Sent" && (
        <section className="surface-panel mt-6 p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <Mail className="size-4 text-primary" /> Simulated Email Confirmation
            </h2>
            <Pill tone="success">
              <Send className="size-3" /> Sent to Customer
            </Pill>
          </div>
          <div className="mt-3 rounded-lg border border-border bg-secondary/30 p-4 text-xs space-y-1.5">
            <p>
              <span className="font-semibold text-foreground">To:</span> {booking.customerEmail}
            </p>
            <p>
              <span className="font-semibold text-foreground">Subject:</span> CineDesk Booking Confirmation —{" "}
              {booking.bookingId ?? booking.requestId}
            </p>
            <hr className="border-border my-2" />
            <p className="text-foreground leading-relaxed">
              Dear <strong>{booking.customerName}</strong>,
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Your movie ticket request <strong>{booking.requestId}</strong> has been successfully confirmed with
              Booking ID <strong>{booking.bookingId}</strong>.
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 my-2">
              <li>Movie: <strong>{booking.movieName}</strong></li>
              <li>Show: <strong>{booking.theatre} ({booking.screen})</strong></li>
              <li>Date &amp; Time: <strong>{formatDate(booking.showDate)} at {formatTime(booking.showTime)}</strong></li>
              <li>Tickets: <strong>{booking.numberOfTickets}</strong> ({booking.showType} Class)</li>
              <li>Total Amount Paid: <strong>{formatCurrency(booking.totalCost)}</strong></li>
            </ul>
            <p className="text-muted-foreground">Thank you for booking with CineDesk!</p>
          </div>
        </section>
      )}

      {/* Notes / Rejection Reason */}
      {booking.notes && (
        <section className="surface-panel mt-6 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Case Notes</h2>
          <p className="mt-2 text-sm text-foreground">{booking.notes}</p>
        </section>
      )}

      {/* Rejection Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Booking Request</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting request {booking.requestId}. This will resolve the case as Rejected.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="reason" className="mb-2 block text-sm">
              Rejection Reason
            </Label>
            <Input
              id="reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Requested show slot unavailable or customer request"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Request?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel request {booking.requestId}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Request</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>Cancel Request</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
