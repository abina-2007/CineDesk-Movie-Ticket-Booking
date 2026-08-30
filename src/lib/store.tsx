import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Booking, BookingStatus, Movie, Show } from "./types";
import { SAMPLE_BOOKINGS, SAMPLE_MOVIES, SAMPLE_SHOWS } from "./sample-data";
import {
  calculateTotalCost,
  checkAvailability,
  nextSequentialId,
  routeByShowType,
  stageForStatus,
} from "./booking-logic";

const STORAGE_KEY = "mtb.state.v1";

interface AppState {
  movies: Movie[];
  shows: Show[];
  bookings: Booking[];
}

const initialState: AppState = {
  movies: SAMPLE_MOVIES,
  shows: SAMPLE_SHOWS,
  bookings: SAMPLE_BOOKINGS,
};

export interface NewBookingInput {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  movieId: string;
  showId: string;
  numberOfTickets: number;
}

interface StoreValue extends AppState {
  hydrated: boolean;
  getMovie: (movieId: string) => Movie | undefined;
  getShow: (showId: string) => Show | undefined;
  getBooking: (requestId: string) => Booking | undefined;
  showsForMovie: (movieId: string) => Show[];
  createBooking: (input: NewBookingInput) => Booking;
  advanceToAvailability: (requestId: string) => void;
  advanceToApproval: (requestId: string) => void;
  approveBooking: (requestId: string) => void;
  rejectBooking: (requestId: string, reason?: string) => void;
  cancelBooking: (requestId: string) => void;
  processBooking: (requestId: string) => { ok: boolean; message: string; booking?: Booking };
  saveMovie: (movie: Movie, isNew: boolean) => void;
  deleteMovie: (movieId: string) => void;
  saveShow: (show: Show, isNew: boolean) => void;
  deleteShow: (showId: string) => void;
  resetData: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppState;
        if (parsed.movies && parsed.shows && parsed.bookings) setState(parsed);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full / unavailable */
    }
  }, [state, hydrated]);

  const patchBooking = useCallback(
    (requestId: string, patch: Partial<Booking>) => {
      setState((prev) => ({
        ...prev,
        bookings: prev.bookings.map((b) =>
          b.requestId === requestId
            ? { ...b, ...patch, stage: stageForStatus((patch.bookingStatus ?? b.bookingStatus) as BookingStatus) }
            : b,
        ),
      }));
    },
    [],
  );

  const value = useMemo<StoreValue>(() => {
    const getShow = (showId: string) => state.shows.find((s) => s.showId === showId);

    return {
      ...state,
      hydrated,
      getMovie: (movieId) => state.movies.find((m) => m.movieId === movieId),
      getShow,
      getBooking: (requestId) => state.bookings.find((b) => b.requestId === requestId),
      showsForMovie: (movieId) =>
        state.shows
          .filter((s) => s.movieId === movieId && s.status !== "Cancelled")
          .sort((a, b) => `${a.showDate}${a.showTime}`.localeCompare(`${b.showDate}${b.showTime}`)),

      createBooking: (input) => {
        const show = getShow(input.showId)!;
        const movie = state.movies.find((m) => m.movieId === input.movieId)!;
        const requestId = nextSequentialId(
          "MTR",
          state.bookings.map((b) => b.requestId),
        );
        const booking: Booking = {
          requestId,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          movieId: movie.movieId,
          movieName: movie.movieName,
          showId: show.showId,
          theatre: show.theatre,
          screen: show.screen,
          showDate: show.showDate,
          showTime: show.showTime,
          showType: show.showType,
          numberOfTickets: input.numberOfTickets,
          ticketPrice: show.ticketPrice,
          totalCost: calculateTotalCost(input.numberOfTickets, show.ticketPrice),
          bookingStatus: "Submitted",
          stage: "Initial",
          createdDate: new Date().toISOString(),
          assignedQueue: routeByShowType(show.showType),
          confirmationStatus: "Not Sent",
        };
        setState((prev) => ({ ...prev, bookings: [booking, ...prev.bookings] }));
        return booking;
      },

      advanceToAvailability: (requestId) => patchBooking(requestId, { bookingStatus: "Availability Check" }),
      advanceToApproval: (requestId) => patchBooking(requestId, { bookingStatus: "Pending Approval" }),
      approveBooking: (requestId) => patchBooking(requestId, { bookingStatus: "Approved" }),
      rejectBooking: (requestId, reason) =>
        patchBooking(requestId, {
          bookingStatus: "Rejected",
          resolvedDate: new Date().toISOString(),
          notes: reason ?? "Rejected by administrator",
        }),
      cancelBooking: (requestId) =>
        patchBooking(requestId, {
          bookingStatus: "Cancelled",
          resolvedDate: new Date().toISOString(),
          notes: "Cancelled by customer",
        }),

      processBooking: (requestId) => {
        const booking = state.bookings.find((b) => b.requestId === requestId);
        if (!booking) return { ok: false, message: "Booking request not found." };
        const show = getShow(booking.showId);
        const result = checkAvailability(show, booking.numberOfTickets);
        if (!result.available) return { ok: false, message: result.message };

        const bookingId = nextSequentialId(
          "BKG",
          state.bookings.filter((b) => b.bookingId).map((b) => b.bookingId!),
        );
        const updated: Booking = {
          ...booking,
          bookingId,
          bookingStatus: "Confirmed",
          stage: "Booking Execution",
          resolvedDate: new Date().toISOString(),
          confirmationStatus: "Sent",
        };
        setState((prev) => ({
          ...prev,
          bookings: prev.bookings.map((b) => (b.requestId === requestId ? updated : b)),
          shows: prev.shows.map((s) =>
            s.showId === booking.showId
              ? {
                  ...s,
                  availableSeats: s.availableSeats - booking.numberOfTickets,
                  status:
                    s.availableSeats - booking.numberOfTickets <= 0 ? ("Housefull" as const) : s.status,
                }
              : s,
          ),
        }));
        return { ok: true, message: "Booking confirmed successfully.", booking: updated };
      },

      saveMovie: (movie, isNew) =>
        setState((prev) => ({
          ...prev,
          movies: isNew
            ? [{ ...movie, movieId: nextSequentialId("MOV", prev.movies.map((m) => m.movieId)) }, ...prev.movies]
            : prev.movies.map((m) => (m.movieId === movie.movieId ? movie : m)),
          shows: isNew
            ? prev.shows
            : prev.shows.map((s) => (s.movieId === movie.movieId ? { ...s, movieName: movie.movieName } : s)),
        })),

      deleteMovie: (movieId) =>
        setState((prev) => ({
          ...prev,
          movies: prev.movies.filter((m) => m.movieId !== movieId),
          shows: prev.shows.filter((s) => s.movieId !== movieId),
        })),

      saveShow: (show, isNew) =>
        setState((prev) => {
          const movie = prev.movies.find((m) => m.movieId === show.movieId);
          const withName = { ...show, movieName: movie?.movieName ?? show.movieName };
          return {
            ...prev,
            shows: isNew
              ? [
                  { ...withName, showId: nextSequentialId("SHW", prev.shows.map((s) => s.showId)) },
                  ...prev.shows,
                ]
              : prev.shows.map((s) => (s.showId === show.showId ? withName : s)),
          };
        }),

      deleteShow: (showId) =>
        setState((prev) => ({ ...prev, shows: prev.shows.filter((s) => s.showId !== showId) })),

      resetData: () => setState(initialState),
    };
  }, [state, hydrated, patchBooking]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
