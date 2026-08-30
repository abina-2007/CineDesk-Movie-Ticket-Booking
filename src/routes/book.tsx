import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Loader2,
  Mail,
  RefreshCcw,
  SearchCheck,
  Ticket,
} from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { StageTracker } from "@/components/StageTracker";
import { SlaPanel } from "@/components/SlaPanel";
import { Pill, QueueBadge, ShowTypeBadge } from "@/components/StatusBadge";
import { useStore } from "@/lib/store";
import { bookingRequestSchema, fieldErrors } from "@/lib/validation";
import {
  calculateTotalCost,
  checkAvailability,
  formatCurrency,
  formatDate,
  formatTime,
  routeByShowType,
} from "@/lib/booking-logic";
import type { Booking, Stage } from "@/lib/types";

const searchSchema = z.object({
  movieId: z.string().optional(),
  showId: z.string().optional(),
});

export const Route = createFileRoute("/book")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Book Tickets — Submit a Movie Ticket Request" },
      {
        name: "description",
        content:
          "Submit a movie ticket request: choose a movie and show, check seat availability, review the auto-calculated total cost and confirm.",
      },
      { property: "og:title", content: "Book Tickets — CineDesk" },
      {
        property: "og:description",
        content: "Guided Initial → Availability → Approval → Booking Execution ticket request workflow.",
      },
    ],
  }),
  component: BookTickets,
});

type Step = Stage | "Success";

function BookTickets() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const store = useStore();
  const { movies, shows } = store;

  const [step, setStep] = useState<Step>("Initial");
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    movieId: search.movieId ?? "",
    showId: search.showId ?? "",
    numberOfTickets: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const activeMovies = movies.filter((m) => m.status === "Active");
  const movieShows = useMemo(
    () => shows.filter((s) => s.movieId === form.movieId && s.status !== "Cancelled"),
    [shows, form.movieId],
  );
  const selectedShow = shows.find((s) => s.showId === form.showId);
  const ticketPrice = selectedShow?.ticketPrice ?? 0;
  const totalCost = calculateTotalCost(form.numberOfTickets, ticketPrice);
  const availability = checkAvailability(selectedShow, form.numberOfTickets);

  useEffect(() => {
    if (form.showId && !movieShows.some((s) => s.showId === form.showId)) {
      setForm((f) => ({ ...f, showId: "" }));
    }
  }, [movieShows, form.showId]);

  const liveBooking = booking ? (store.getBooking(booking.requestId) ?? booking) : null;

  function handleSubmitRequest(e: React.FormEvent) {
    e.preventDefault();
    const parsed = bookingRequestSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      toast.error("Please correct the highlighted fields.");
      return;
    }
    setErrors({});
    setSubmitting(true);
    setTimeout(() => {
      const created = store.createBooking(parsed.data);
      setBooking(created);
      store.advanceToAvailability(created.requestId);
      setSubmitting(false);
      setStep("Availability");
      toast.success(`Request ${created.requestId} submitted`, {
        description: "Moved to the Availability stage for seat verification.",
      });
    }, 700);
  }

  function proceedToApproval() {
    if (!liveBooking) return;
    if (!availability.available) {
      toast.error(availability.message);
      return;
    }
    store.advanceToApproval(liveBooking.requestId);
    setStep("Approval");
    toast.success("Availability confirmed", { description: "Request routed to " + liveBooking.assignedQueue });
  }

  function confirmBooking() {
    if (!liveBooking) return;
    setConfirmOpen(false);
    setProcessing(true);
    store.approveBooking(liveBooking.requestId);
    setStep("Booking Execution");
    setTimeout(() => {
      const result = store.processBooking(liveBooking.requestId);
      setProcessing(false);
      if (!result.ok) {
        toast.error(result.message);
        setStep("Approval");
        return;
      }
      setStep("Success");
      toast.success("Booking confirmed successfully", {
        description: `Confirmation email sent to ${liveBooking.customerEmail}`,
      });
    }, 1200);
  }

  function cancelRequest() {
    if (!liveBooking) return;
    store.cancelBooking(liveBooking.requestId);
    setCancelOpen(false);
    toast.info(`Request ${liveBooking.requestId} cancelled`);
    navigate({ to: "/bookings" });
  }

  const currentStage: Stage = step === "Success" ? "Booking Execution" : step;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Movie Ticket Request</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Case lifecycle: Initial → Availability → Approval → Booking Execution.
        </p>
      </header>

      <div className="surface-panel mt-6 p-5">
        <StageTracker current={currentStage} />
      </div>

      {step === "Initial" && (
        <form onSubmit={handleSubmitRequest} className="surface-panel mt-6 p-6" noValidate>
          <h2 className="text-lg font-semibold">Stage 1 · Initial — Request details</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            All fields are required and validated before the request is submitted.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="Customer Name" error={errors["customerName"]} htmlFor="customerName">
              <Input
                id="customerName"
                value={form.customerName}
                maxLength={80}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                placeholder="e.g. Ananya Sharma"
              />
            </Field>
            <Field label="Customer Email" error={errors["customerEmail"]} htmlFor="customerEmail">
              <Input
                id="customerEmail"
                type="email"
                value={form.customerEmail}
                maxLength={120}
                onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                placeholder="name@example.com"
              />
            </Field>
            <Field label="Customer Phone" error={errors["customerPhone"]} htmlFor="customerPhone">
              <Input
                id="customerPhone"
                inputMode="numeric"
                maxLength={10}
                value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value.replace(/\D/g, "") })}
                placeholder="10-digit mobile number"
              />
            </Field>
            <Field label="Movie" error={errors["movieId"]}>
              <Select
                value={form.movieId}
                onValueChange={(v) => setForm({ ...form, movieId: v, showId: "" })}
              >
                <SelectTrigger aria-label="Select movie">
                  <SelectValue placeholder="Select a movie" />
                </SelectTrigger>
                <SelectContent>
                  {activeMovies.map((m) => (
                    <SelectItem key={m.movieId} value={m.movieId}>
                      {m.movieName} ({m.language})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Show" error={errors["showId"]} className="sm:col-span-2">
              <Select
                value={form.showId}
                onValueChange={(v) => setForm({ ...form, showId: v })}
                disabled={!form.movieId}
              >
                <SelectTrigger aria-label="Select show">
                  <SelectValue placeholder={form.movieId ? "Select a show" : "Select a movie first"} />
                </SelectTrigger>
                <SelectContent>
                  {movieShows.map((s) => (
                    <SelectItem key={s.showId} value={s.showId}>
                      {formatDate(s.showDate)} · {formatTime(s.showTime)} · {s.theatre} ({s.screen}) · {s.showType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {selectedShow && (
            <div className="mt-5 grid gap-3 rounded-xl border border-border bg-secondary/30 p-4 sm:grid-cols-4">
              <Readout label="Show Date" value={formatDate(selectedShow.showDate)} />
              <Readout label="Show Time" value={formatTime(selectedShow.showTime)} />
              <Readout label="Show Type" value={selectedShow.showType} />
              <Readout label="Available Seats" value={String(selectedShow.availableSeats)} />
            </div>
          )}

          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            <Field label="Number of Tickets" error={errors["numberOfTickets"]} htmlFor="tickets">
              <Input
                id="tickets"
                type="number"
                min={1}
                max={10}
                value={form.numberOfTickets}
                onChange={(e) => setForm({ ...form, numberOfTickets: Number(e.target.value) })}
              />
            </Field>
            <Readout label="Ticket Price (auto)" value={formatCurrency(ticketPrice)} boxed />
            <Readout label="Total Cost (calculated)" value={formatCurrency(totalCost)} boxed highlight />
          </div>

          {selectedShow && !availability.available && (
            <p className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="size-4" /> {availability.message}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Submitting request…
                </>
              ) : (
                <>
                  Submit Ticket Request <ArrowRight className="size-4" />
                </>
              )}
            </Button>
            <Button asChild type="button" variant="outline" size="lg">
              <Link to="/movies">Browse movies</Link>
            </Button>
          </div>
        </form>
      )}

      {step === "Availability" && liveBooking && selectedShow && (
        <section className="surface-panel mt-6 p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <SearchCheck className="size-5 text-primary" /> Stage 2 · Availability check
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Request <span className="font-mono text-primary">{liveBooking.requestId}</span> is verifying seat
            availability for the selected show.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Readout label="Movie" value={liveBooking.movieName} boxed />
            <Readout label="Theatre" value={selectedShow.theatre} boxed />
            <Readout label="Screen" value={selectedShow.screen} boxed />
            <Readout label="Date" value={formatDate(selectedShow.showDate)} boxed />
            <Readout label="Time" value={formatTime(selectedShow.showTime)} boxed />
            <Readout label="Show Type" value={selectedShow.showType} boxed />
            <Readout label="Available Seats" value={String(selectedShow.availableSeats)} boxed />
            <Readout label="Requested Tickets" value={String(liveBooking.numberOfTickets)} boxed />
            <Readout label="Total Cost" value={formatCurrency(liveBooking.totalCost)} boxed highlight />
          </div>

          <div
            className={
              availability.available
                ? "mt-5 flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 p-4 text-sm text-success"
                : "mt-5 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
            }
          >
            {availability.available ? <CheckCircle2 className="size-5" /> : <AlertTriangle className="size-5" />}
            <span className="font-medium">
              {availability.available ? "Availability result: Seats available. " : "Availability result: "}
              {availability.message}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" onClick={proceedToApproval} disabled={!availability.available}>
              Proceed to Approval <ArrowRight className="size-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => setStep("Initial")}>
              <RefreshCcw className="size-4" /> Change selection
            </Button>
          </div>
        </section>
      )}

      {(step === "Approval" || step === "Booking Execution") && liveBooking && (
        <section className="mt-6 space-y-6">
          <div className="surface-panel p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <BadgeCheck className="size-5 text-primary" /> Stage 3 · Booking review &amp; approval
              </h2>
              <div className="flex flex-wrap gap-2">
                <ShowTypeBadge type={liveBooking.showType} />
                <QueueBadge queue={liveBooking.assignedQueue} />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Readout label="Request ID" value={liveBooking.requestId} boxed />
              <Readout label="Customer" value={liveBooking.customerName} boxed />
              <Readout label="Email" value={liveBooking.customerEmail} boxed />
              <Readout label="Phone" value={liveBooking.customerPhone} boxed />
              <Readout label="Movie" value={liveBooking.movieName} boxed />
              <Readout label="Show" value={`${liveBooking.theatre} · ${liveBooking.screen}`} boxed />
              <Readout label="Date" value={formatDate(liveBooking.showDate)} boxed />
              <Readout label="Time" value={formatTime(liveBooking.showTime)} boxed />
              <Readout label="Tickets" value={String(liveBooking.numberOfTickets)} boxed />
              <Readout label="Ticket Price" value={formatCurrency(liveBooking.ticketPrice)} boxed />
              <Readout
                label="Total Cost"
                value={`${liveBooking.numberOfTickets} × ${formatCurrency(liveBooking.ticketPrice)} = ${formatCurrency(liveBooking.totalCost)}`}
                boxed
                highlight
              />
              <Readout label="Assigned Queue" value={routeByShowType(liveBooking.showType)} boxed />
            </div>

            {step === "Booking Execution" ? (
              <div className="mt-6 flex items-center gap-3 rounded-lg border border-border bg-secondary/40 p-4 text-sm">
                {processing ? (
                  <>
                    <Loader2 className="size-5 animate-spin text-primary" />
                    <span>Stage 4 · Processing booking, reducing available seats and generating booking ID…</span>
                  </>
                ) : (
                  <span>Processing complete.</span>
                )}
              </div>
            ) : (
              <div className="mt-6 flex flex-wrap gap-3">
                <Button size="lg" onClick={() => setConfirmOpen(true)}>
                  Confirm Booking
                </Button>
                <Button size="lg" variant="destructive" onClick={() => setCancelOpen(true)}>
                  Cancel Booking
                </Button>
              </div>
            )}
          </div>

          <SlaPanel booking={liveBooking} />
        </section>
      )}

      {step === "Success" && liveBooking && (
        <section className="mt-6 space-y-6">
          <div className="surface-panel p-6 text-center sm:p-10">
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="size-9" />
            </span>
            <h2 className="mt-4 text-2xl font-bold">Booking Confirmed Successfully</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Seats have been deducted from the show inventory and the case is resolved.
            </p>

            <div className="mx-auto mt-6 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
              <Readout label="Booking ID" value={liveBooking.bookingId ?? "—"} boxed highlight />
              <Readout label="Movie" value={liveBooking.movieName} boxed />
              <Readout label="Theatre / Screen" value={`${liveBooking.theatre} · ${liveBooking.screen}`} boxed />
              <Readout label="Date" value={formatDate(liveBooking.showDate)} boxed />
              <Readout label="Time" value={formatTime(liveBooking.showTime)} boxed />
              <Readout label="Tickets" value={String(liveBooking.numberOfTickets)} boxed />
              <Readout label="Total Cost" value={formatCurrency(liveBooking.totalCost)} boxed highlight />
              <Readout label="Assigned Queue" value={liveBooking.assignedQueue} boxed />
              <Readout label="Confirmation Status" value={liveBooking.confirmationStatus} boxed />
            </div>

            <div className="mx-auto mt-6 max-w-3xl rounded-xl border border-border bg-secondary/30 p-4 text-left">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Mail className="size-4 text-primary" /> Email confirmation simulation
              </p>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <p>
                  <span className="text-foreground">To:</span> {liveBooking.customerEmail}
                </p>
                <p>
                  <span className="text-foreground">Subject:</span> Your CineDesk booking{" "}
                  {liveBooking.bookingId} is confirmed
                </p>
                <p className="pt-1">
                  Hi {liveBooking.customerName}, your {liveBooking.numberOfTickets} ticket(s) for{" "}
                  {liveBooking.movieName} at {liveBooking.theatre} ({liveBooking.screen}) on{" "}
                  {formatDate(liveBooking.showDate)} at {formatTime(liveBooking.showTime)} are confirmed. Amount
                  paid: {formatCurrency(liveBooking.totalCost)}.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/bookings/$requestId" params={{ requestId: liveBooking.requestId }}>
                  View booking details
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/bookings">My Bookings</Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => {
                  setBooking(null);
                  setStep("Initial");
                  setForm({
                    customerName: "",
                    customerEmail: "",
                    customerPhone: "",
                    movieId: "",
                    showId: "",
                    numberOfTickets: 1,
                  });
                }}
              >
                <Ticket className="size-4" /> New request
              </Button>
            </div>
          </div>

          <SlaPanel booking={liveBooking} />
        </section>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              {liveBooking?.numberOfTickets} ticket(s) for {liveBooking?.movieName} will be booked for{" "}
              {formatCurrency(liveBooking?.totalCost ?? 0)}. Available seats will be reduced immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go back</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBooking}>Confirm booking</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this ticket request?</AlertDialogTitle>
            <AlertDialogDescription>
              Request {liveBooking?.requestId} will be marked as Cancelled. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep request</AlertDialogCancel>
            <AlertDialogAction onClick={cancelRequest}>Cancel request</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Field({
  label,
  error,
  children,
  className,
  htmlFor,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
  className?: string | undefined;
  htmlFor?: string | undefined;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} className="mb-2 block text-sm">
        {label}
      </Label>
      {children}
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Readout({
  label,
  value,
  boxed = false,
  highlight = false,
}: {
  label: string;
  value: string;
  boxed?: boolean | undefined;
  highlight?: boolean | undefined;
}) {
  const content = (
    <>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={highlight ? "mt-1 text-lg font-bold text-primary" : "mt-1 text-sm font-semibold"}>{value}</p>
    </>
  );
  if (!boxed) return <div>{content}</div>;
  return <div className="rounded-lg border border-border bg-secondary/40 p-3">{content}</div>;
}

export { Pill };
