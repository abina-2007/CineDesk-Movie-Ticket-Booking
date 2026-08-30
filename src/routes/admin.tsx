import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  AlarmClock,
  AlertTriangle,
  BadgeCheck,
  Calendar,
  Check,
  CheckCircle2,
  Clapperboard,
  Clock,
  Crown,
  Edit2,
  Eye,
  Film,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Star,
  Ticket,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { BookingStatusBadge, Pill, QueueBadge, ShowTypeBadge, SlaBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";
import {
  calculateTotalCost,
  checkAvailability,
  formatCurrency,
  formatDate,
  formatTime,
  getSlaInfo,
  routeByShowType,
} from "@/lib/booking-logic";
import { POSTER_OPTIONS, posterSrc } from "@/lib/posters";
import type { Booking, Movie, Show, ShowType } from "@/lib/types";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Management — CineDesk" },
      {
        name: "description",
        content: "Operations control center for queues, bookings, movies and shows.",
      },
      { property: "og:title", content: "Admin Management — CineDesk" },
      {
        property: "og:description",
        content: "Manage movie ticket queues, approvals, shows, inventory and movies.",
      },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const store = useStore();
  const { movies, shows, bookings } = store;

  // Active tab
  const [activeTab, setActiveTab] = useState("bookings");

  // Booking filters
  const [bookingQueue, setBookingQueue] = useState<string>("all");
  const [bookingStatus, setBookingStatus] = useState<string>("all");
  const [bookingSla, setBookingSla] = useState<string>("all");
  const [bookingSearch, setBookingSearch] = useState("");

  // Reject modal state
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Movie modal state
  const [movieModalOpen, setMovieModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [movieForm, setMovieForm] = useState<Omit<Movie, "movieId">>({
    movieName: "",
    genre: "Action",
    language: "English",
    duration: 120,
    rating: 8.0,
    description: "",
    poster: "interstellar-echo",
    status: "Active",
  });

  // Show modal state
  const [showModalOpen, setShowModalOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const [showForm, setShowForm] = useState<{
    movieId: string;
    theatre: string;
    screen: string;
    showDate: string;
    showTime: string;
    showType: ShowType;
    ticketPrice: number;
    totalSeats: number;
    availableSeats: number;
    status: "Open" | "Housefull" | "Cancelled";
  }>({
    movieId: movies[0]?.movieId ?? "",
    theatre: "PVR Icon",
    screen: "Screen 1",
    showDate: new Date().toISOString().slice(0, 10),
    showTime: "18:00",
    showType: "Standard",
    ticketPrice: 250,
    totalSeats: 100,
    availableSeats: 100,
    status: "Open",
  });

  // Reset confirmation
  const [resetOpen, setResetOpen] = useState(false);

  // Filtered bookings
  const filteredBookings = bookings.filter((b) => {
    const q = bookingSearch.trim().toLowerCase();
    const matchQuery =
      !q ||
      b.requestId.toLowerCase().includes(q) ||
      b.customerName.toLowerCase().includes(q) ||
      b.movieName.toLowerCase().includes(q);

    const matchQueue = bookingQueue === "all" || b.assignedQueue === bookingQueue;
    const matchStatus = bookingStatus === "all" || b.bookingStatus === bookingStatus;
    const sla = getSlaInfo(b);
    const matchSla = bookingSla === "all" || sla.status === bookingSla;

    return matchQuery && matchQueue && matchStatus && matchSla;
  });

  // Handler functions
  function handleQuickApprove(requestId: string) {
    store.approveBooking(requestId);
    toast.success(`Request ${requestId} approved`);
  }

  function handleQuickReject() {
    if (!rejectId) return;
    store.rejectBooking(rejectId, rejectReason || "Rejected by administrator");
    setRejectId(null);
    setRejectReason("");
    toast.error(`Request ${rejectId} rejected`);
  }

  function handleQuickProcess(requestId: string) {
    const result = store.processBooking(requestId);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(`Request ${requestId} confirmed & executed`, {
      description: `Assigned Booking ID: ${result.booking?.bookingId}`,
    });
  }

  function openCreateMovie() {
    setEditingMovie(null);
    setMovieForm({
      movieName: "",
      genre: "Action",
      language: "Hindi",
      duration: 125,
      rating: 8.0,
      description: "",
      poster: POSTER_OPTIONS[0] ?? "interstellar-echo",
      status: "Active",
    });
    setMovieModalOpen(true);
  }

  function openEditMovie(movie: Movie) {
    setEditingMovie(movie);
    setMovieForm({
      movieName: movie.movieName,
      genre: movie.genre,
      language: movie.language,
      duration: movie.duration,
      rating: movie.rating,
      description: movie.description,
      poster: movie.poster,
      status: movie.status,
    });
    setMovieModalOpen(true);
  }

  function handleSaveMovie(e: React.FormEvent) {
    e.preventDefault();
    if (!movieForm.movieName.trim()) {
      toast.error("Movie name is required");
      return;
    }
    if (editingMovie) {
      store.saveMovie({ ...editingMovie, ...movieForm }, false);
      toast.success(`Movie "${movieForm.movieName}" updated`);
    } else {
      store.saveMovie({ movieId: "", ...movieForm }, true);
      toast.success(`New movie "${movieForm.movieName}" added`);
    }
    setMovieModalOpen(false);
  }

  function handleDeleteMovie(movieId: string, name: string) {
    if (confirm(`Delete movie "${name}" and all its scheduled shows?`)) {
      store.deleteMovie(movieId);
      toast.info(`Movie "${name}" deleted`);
    }
  }

  function openCreateShow() {
    setEditingShow(null);
    const firstMovie = movies[0];
    setShowForm({
      movieId: firstMovie?.movieId ?? "",
      theatre: "PVR Icon",
      screen: "Screen 1",
      showDate: new Date().toISOString().slice(0, 10),
      showTime: "19:00",
      showType: "Standard",
      ticketPrice: 250,
      totalSeats: 100,
      availableSeats: 100,
      status: "Open",
    });
    setShowModalOpen(true);
  }

  function openEditShow(show: Show) {
    setEditingShow(show);
    setShowForm({
      movieId: show.movieId,
      theatre: show.theatre,
      screen: show.screen,
      showDate: show.showDate,
      showTime: show.showTime,
      showType: show.showType,
      ticketPrice: show.ticketPrice,
      totalSeats: show.totalSeats,
      availableSeats: show.availableSeats,
      status: show.status,
    });
    setShowModalOpen(true);
  }

  function handleSaveShow(e: React.FormEvent) {
    e.preventDefault();
    if (!showForm.theatre.trim() || !showForm.screen.trim()) {
      toast.error("Theatre and Screen are required");
      return;
    }
    const movie = store.getMovie(showForm.movieId);
    const movieName = movie?.movieName ?? "Movie";
    if (editingShow) {
      store.saveShow(
        {
          ...editingShow,
          ...showForm,
          movieName,
          status: showForm.availableSeats <= 0 ? "Housefull" : showForm.status,
        },
        false,
      );
      toast.success(`Show updated`);
    } else {
      store.saveShow(
        {
          showId: "",
          ...showForm,
          movieName,
          status: showForm.availableSeats <= 0 ? "Housefull" : showForm.status,
        },
        true,
      );
      toast.success(`New show scheduled`);
    }
    setShowModalOpen(false);
  }

  function handleDeleteShow(showId: string) {
    if (confirm(`Delete show ${showId}?`)) {
      store.deleteShow(showId);
      toast.info(`Show ${showId} deleted`);
    }
  }

  function handleResetData() {
    store.resetData();
    setResetOpen(false);
    toast.success("State reset to initial sample data");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Operations Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage case queues, approve/process bookings, update movie catalogue and configure show inventory.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setResetOpen(true)}>
            <RefreshCw className="size-3.5" /> Reset Sample Data
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="bookings">Bookings &amp; Queues</TabsTrigger>
          <TabsTrigger value="movies">Movies ({movies.length})</TabsTrigger>
          <TabsTrigger value="shows">Shows ({shows.length})</TabsTrigger>
        </TabsList>

        {/* ======================= TAB 1: BOOKINGS & QUEUES ======================= */}
        <TabsContent value="bookings" className="mt-6 space-y-6">
          {/* Quick Queue Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-premium/30 bg-premium/10 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-premium">
                  Premium ShowQueue
                </span>
                <Crown className="size-4 text-premium" />
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {bookings.filter((b) => b.assignedQueue === "Premium ShowQueue").length}
              </p>
              <p className="text-xs text-muted-foreground">Premium shows routing</p>
            </div>

            <div className="rounded-xl border border-info/30 bg-info/10 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-info">
                  Standard ShowQueue
                </span>
                <Ticket className="size-4 text-info" />
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {bookings.filter((b) => b.assignedQueue === "Standard ShowQueue").length}
              </p>
              <p className="text-xs text-muted-foreground">Standard shows routing</p>
            </div>

            <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-warning">
                  Pending Approvals
                </span>
                <Clock className="size-4 text-warning" />
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {bookings.filter((b) => b.bookingStatus === "Pending Approval").length}
              </p>
              <p className="text-xs text-muted-foreground">Awaiting admin review</p>
            </div>

            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-destructive">
                  SLA Breached
                </span>
                <AlarmClock className="size-4 text-destructive" />
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {bookings.filter((b) => getSlaInfo(b).status === "SLA Breached").length}
              </p>
              <p className="text-xs text-muted-foreground">&gt; 48h deadline exceeded</p>
            </div>
          </div>

          {/* Filters */}
          <div className="surface-panel p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  placeholder="Search requests..."
                  className="pl-9"
                />
              </div>

              <Select value={bookingQueue} onValueChange={setBookingQueue}>
                <SelectTrigger>
                  <SelectValue placeholder="Queue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Queues</SelectItem>
                  <SelectItem value="Premium ShowQueue">Premium ShowQueue</SelectItem>
                  <SelectItem value="Standard ShowQueue">Standard ShowQueue</SelectItem>
                </SelectContent>
              </Select>

              <Select value={bookingStatus} onValueChange={setBookingStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="Availability Check">Availability Check</SelectItem>
                  <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={bookingSla} onValueChange={setBookingSla}>
                <SelectTrigger>
                  <SelectValue placeholder="SLA Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All SLA</SelectItem>
                  <SelectItem value="Within SLA">Within SLA</SelectItem>
                  <SelectItem value="Approaching Deadline">Approaching Deadline</SelectItem>
                  <SelectItem value="SLA Breached">SLA Breached</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="surface-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-secondary/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3.5">Request ID</th>
                    <th className="px-4 py-3.5">Customer</th>
                    <th className="px-4 py-3.5">Movie / Show</th>
                    <th className="px-4 py-3.5">Queue</th>
                    <th className="px-4 py-3.5">Tickets / Total</th>
                    <th className="px-4 py-3.5">Stage &amp; Status</th>
                    <th className="px-4 py-3.5">SLA</th>
                    <th className="px-4 py-3.5 text-right">Workflow Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredBookings.map((b) => {
                    const sla = getSlaInfo(b);
                    return (
                      <tr key={b.requestId} className="hover:bg-secondary/30">
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <span className="font-mono font-bold text-primary">{b.requestId}</span>
                          {b.bookingId && (
                            <p className="font-mono text-xs text-success">{b.bookingId}</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-foreground">{b.customerName}</p>
                          <p className="text-xs text-muted-foreground">{b.customerPhone}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-foreground">{b.movieName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(b.showDate)} · {formatTime(b.showTime)}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <QueueBadge queue={b.assignedQueue} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <p className="font-medium">{b.numberOfTickets} tix</p>
                          <p className="font-mono text-xs text-primary font-semibold">
                            {formatCurrency(b.totalCost)}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <div className="space-y-1">
                            <BookingStatusBadge status={b.bookingStatus} />
                            <p className="text-[11px] text-muted-foreground">{b.stage}</p>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <SlaBadge status={sla.status} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {b.bookingStatus === "Submitted" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => store.advanceToAvailability(b.requestId)}
                              >
                                Check Avail.
                              </Button>
                            )}

                            {b.bookingStatus === "Availability Check" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => store.advanceToApproval(b.requestId)}
                              >
                                Route Queue
                              </Button>
                            )}

                            {b.bookingStatus === "Pending Approval" && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-success text-success-foreground hover:bg-success/90 h-8 px-2 text-xs"
                                  onClick={() => handleQuickApprove(b.requestId)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 px-2 text-xs"
                                  onClick={() => {
                                    setRejectId(b.requestId);
                                    setRejectReason("");
                                  }}
                                >
                                  Reject
                                </Button>
                              </>
                            )}

                            {b.bookingStatus === "Approved" && (
                              <Button
                                size="sm"
                                className="h-8 px-2 text-xs"
                                onClick={() => handleQuickProcess(b.requestId)}
                              >
                                <BadgeCheck className="size-3.5 mr-1" /> Execute
                              </Button>
                            )}

                            <Button asChild variant="ghost" size="sm" className="h-8 px-2">
                              <Link to="/bookings/$requestId" params={{ requestId: b.requestId }}>
                                <Eye className="size-3.5" />
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ======================= TAB 2: MOVIE MANAGEMENT ======================= */}
        <TabsContent value="movies" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Movies Catalogue Management</h2>
            <Button onClick={openCreateMovie}>
              <Plus className="size-4" /> Add New Movie
            </Button>
          </div>

          <div className="surface-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-secondary/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3.5">Movie ID</th>
                    <th className="px-4 py-3.5">Poster &amp; Title</th>
                    <th className="px-4 py-3.5">Genre / Language</th>
                    <th className="px-4 py-3.5">Duration</th>
                    <th className="px-4 py-3.5">Rating</th>
                    <th className="px-4 py-3.5">Active Shows</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {movies.map((m) => {
                    const activeShows = shows.filter(
                      (s) => s.movieId === m.movieId && s.status !== "Cancelled",
                    ).length;
                    return (
                      <tr key={m.movieId} className="hover:bg-secondary/30">
                        <td className="font-mono text-xs font-bold text-primary px-4 py-3.5">
                          {m.movieId}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="size-10 shrink-0 overflow-hidden rounded border border-border bg-secondary">
                              {posterSrc(m.poster) ? (
                                <img
                                  src={posterSrc(m.poster)!}
                                  alt={m.movieName}
                                  className="size-full object-cover"
                                />
                              ) : (
                                <Film className="size-full p-2 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{m.movieName}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                                {m.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-foreground">{m.genre}</p>
                          <p className="text-xs text-muted-foreground">{m.language}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">{m.duration} mins</td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <Pill tone="gold">
                            <Star className="size-3 fill-current" /> {m.rating.toFixed(1)}
                          </Pill>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <Pill tone={activeShows > 0 ? "success" : "neutral"}>
                            {activeShows} shows
                          </Pill>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <Pill tone={m.status === "Active" ? "success" : "danger"}>
                            {m.status}
                          </Pill>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5"
                              onClick={() => openEditMovie(m)}
                            >
                              <Edit2 className="size-3.5" /> Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteMovie(m.movieId, m.movieName)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ======================= TAB 3: SHOW MANAGEMENT ======================= */}
        <TabsContent value="shows" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Shows &amp; Inventory Management</h2>
            <Button onClick={openCreateShow}>
              <Plus className="size-4" /> Schedule New Show
            </Button>
          </div>

          <div className="surface-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-secondary/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3.5">Show ID</th>
                    <th className="px-4 py-3.5">Movie</th>
                    <th className="px-4 py-3.5">Theatre &amp; Screen</th>
                    <th className="px-4 py-3.5">Date &amp; Time</th>
                    <th className="px-4 py-3.5">Show Type &amp; Queue</th>
                    <th className="px-4 py-3.5">Price</th>
                    <th className="px-4 py-3.5">Seats Inventory</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {shows.map((s) => {
                    const isSoldOut = s.availableSeats <= 0;
                    return (
                      <tr key={s.showId} className="hover:bg-secondary/30">
                        <td className="font-mono text-xs font-bold text-primary px-4 py-3.5">
                          {s.showId}
                        </td>
                        <td className="font-semibold px-4 py-3.5">{s.movieName}</td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-foreground">{s.theatre}</p>
                          <p className="text-xs text-muted-foreground">{s.screen}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <p className="text-xs font-medium">{formatDate(s.showDate)}</p>
                          <p className="text-xs text-muted-foreground">{formatTime(s.showTime)}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <div className="space-y-1">
                            <ShowTypeBadge type={s.showType} />
                            <p className="text-[11px] text-muted-foreground">
                              → {routeByShowType(s.showType)}
                            </p>
                          </div>
                        </td>
                        <td className="whitespace-nowrap font-mono text-xs font-bold px-4 py-3.5">
                          {formatCurrency(s.ticketPrice)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span
                                className={
                                  isSoldOut ? "font-bold text-destructive" : "font-medium text-success"
                                }
                              >
                                {s.availableSeats} available
                              </span>
                              <span className="text-muted-foreground">/ {s.totalSeats}</span>
                            </div>
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
                              <div
                                className={
                                  isSoldOut ? "h-full bg-destructive" : "h-full bg-success"
                                }
                                style={{
                                  width: `${Math.round((s.availableSeats / s.totalSeats) * 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <Pill
                            tone={
                              s.status === "Open"
                                ? "success"
                                : s.status === "Housefull"
                                  ? "danger"
                                  : "neutral"
                            }
                          >
                            {s.status}
                          </Pill>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5"
                              onClick={() => openEditShow(s)}
                            >
                              <Edit2 className="size-3.5" /> Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteShow(s.showId)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ======================= MOVIE MODAL ======================= */}
      <Dialog open={movieModalOpen} onOpenChange={setMovieModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveMovie}>
            <DialogHeader>
              <DialogTitle>{editingMovie ? "Edit Movie" : "Add New Movie"}</DialogTitle>
              <DialogDescription>
                Configure movie details, genre, language, duration and poster art.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="movieName" className="mb-1 block text-xs font-semibold">
                  Movie Name *
                </Label>
                <Input
                  id="movieName"
                  value={movieForm.movieName}
                  onChange={(e) => setMovieForm({ ...movieForm, movieName: e.target.value })}
                  placeholder="e.g. Inception"
                  required
                />
              </div>
              <div>
                <Label htmlFor="genre" className="mb-1 block text-xs font-semibold">
                  Genre *
                </Label>
                <Input
                  id="genre"
                  value={movieForm.genre}
                  onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })}
                  placeholder="e.g. Sci-Fi / Action"
                  required
                />
              </div>
              <div>
                <Label htmlFor="language" className="mb-1 block text-xs font-semibold">
                  Language *
                </Label>
                <Input
                  id="language"
                  value={movieForm.language}
                  onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                  placeholder="e.g. English, Hindi, Telugu"
                  required
                />
              </div>
              <div>
                <Label htmlFor="duration" className="mb-1 block text-xs font-semibold">
                  Duration (mins) *
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min={30}
                  max={300}
                  value={movieForm.duration}
                  onChange={(e) => setMovieForm({ ...movieForm, duration: Number(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="rating" className="mb-1 block text-xs font-semibold">
                  Rating (0 - 10) *
                </Label>
                <Input
                  id="rating"
                  type="number"
                  step="0.1"
                  min={0}
                  max={10}
                  value={movieForm.rating}
                  onChange={(e) => setMovieForm({ ...movieForm, rating: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="poster" className="mb-1 block text-xs font-semibold">
                  Poster Preset *
                </Label>
                <Select
                  value={movieForm.poster}
                  onValueChange={(v) => setMovieForm({ ...movieForm, poster: v })}
                >
                  <SelectTrigger id="poster">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POSTER_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="description" className="mb-1 block text-xs font-semibold">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={movieForm.description}
                  onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                  placeholder="Brief synopsis of the film..."
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="status" className="mb-1 block text-xs font-semibold">
                  Status
                </Label>
                <Select
                  value={movieForm.status}
                  onValueChange={(v) => setMovieForm({ ...movieForm, status: v as "Active" | "Inactive" })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMovieModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Movie</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================= SHOW MODAL ======================= */}
      <Dialog open={showModalOpen} onOpenChange={setShowModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveShow}>
            <DialogHeader>
              <DialogTitle>{editingShow ? "Edit Show" : "Schedule New Show"}</DialogTitle>
              <DialogDescription>
                Assign movie, theatre, date/time, Show Type (Premium / Standard) and seat inventory.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="showMovie" className="mb-1 block text-xs font-semibold">
                  Movie *
                </Label>
                <Select
                  value={showForm.movieId}
                  onValueChange={(v) => setShowForm({ ...showForm, movieId: v })}
                >
                  <SelectTrigger id="showMovie">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {movies.map((m) => (
                      <SelectItem key={m.movieId} value={m.movieId}>
                        {m.movieName} ({m.language})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="theatre" className="mb-1 block text-xs font-semibold">
                  Theatre *
                </Label>
                <Input
                  id="theatre"
                  value={showForm.theatre}
                  onChange={(e) => setShowForm({ ...showForm, theatre: e.target.value })}
                  placeholder="e.g. PVR Icon"
                  required
                />
              </div>
              <div>
                <Label htmlFor="screen" className="mb-1 block text-xs font-semibold">
                  Screen *
                </Label>
                <Input
                  id="screen"
                  value={showForm.screen}
                  onChange={(e) => setShowForm({ ...showForm, screen: e.target.value })}
                  placeholder="e.g. Screen 1 / IMAX"
                  required
                />
              </div>
              <div>
                <Label htmlFor="showDate" className="mb-1 block text-xs font-semibold">
                  Show Date *
                </Label>
                <Input
                  id="showDate"
                  type="date"
                  value={showForm.showDate}
                  onChange={(e) => setShowForm({ ...showForm, showDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="showTime" className="mb-1 block text-xs font-semibold">
                  Show Time *
                </Label>
                <Input
                  id="showTime"
                  type="time"
                  value={showForm.showTime}
                  onChange={(e) => setShowForm({ ...showForm, showTime: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="showType" className="mb-1 block text-xs font-semibold">
                  Show Type (Routes to Queue) *
                </Label>
                <Select
                  value={showForm.showType}
                  onValueChange={(v) => setShowForm({ ...showForm, showType: v as ShowType })}
                >
                  <SelectTrigger id="showType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Premium">Premium (→ Premium ShowQueue)</SelectItem>
                    <SelectItem value="Standard">Standard (→ Standard ShowQueue)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ticketPrice" className="mb-1 block text-xs font-semibold">
                  Ticket Price (₹) *
                </Label>
                <Input
                  id="ticketPrice"
                  type="number"
                  min={10}
                  max={5000}
                  value={showForm.ticketPrice}
                  onChange={(e) => setShowForm({ ...showForm, ticketPrice: Number(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="totalSeats" className="mb-1 block text-xs font-semibold">
                  Total Seats *
                </Label>
                <Input
                  id="totalSeats"
                  type="number"
                  min={1}
                  max={500}
                  value={showForm.totalSeats}
                  onChange={(e) =>
                    setShowForm({
                      ...showForm,
                      totalSeats: Number(e.target.value),
                      availableSeats: Math.min(showForm.availableSeats, Number(e.target.value)),
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="availableSeats" className="mb-1 block text-xs font-semibold">
                  Available Seats *
                </Label>
                <Input
                  id="availableSeats"
                  type="number"
                  min={0}
                  max={showForm.totalSeats}
                  value={showForm.availableSeats}
                  onChange={(e) =>
                    setShowForm({ ...showForm, availableSeats: Number(e.target.value) })
                  }
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Show</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================= REJECT DIALOG ======================= */}
      <Dialog open={!!rejectId} onOpenChange={(open) => !open && setRejectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Booking Request {rejectId}</DialogTitle>
            <DialogDescription>
              Provide an administrative reason for rejecting this booking request.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="adminRejectReason" className="mb-2 block text-xs font-semibold">
              Reason
            </Label>
            <Input
              id="adminRejectReason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Screening slot changed or capacity limit"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleQuickReject}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================= RESET DATA DIALOG ======================= */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Sample Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore all sample movies, scheduled shows, seat inventories, and seed ticket requests. All
              custom modifications will be reset.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetData}>Reset All Data</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
