import type { Booking, Movie, Show } from "./types";
import { calculateTotalCost, routeByShowType, stageForStatus } from "./booking-logic";

function dayOffset(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3600_000).toISOString();
}

export const SAMPLE_MOVIES: Movie[] = [
  {
    movieId: "MOV-0001",
    movieName: "Interstellar Echo",
    genre: "Sci-Fi",
    language: "English",
    duration: 148,
    rating: 8.7,
    description:
      "A deep-space listening post picks up a signal that is a perfect echo of a transmission sent from Earth 40 years in the future.",
    poster: "interstellar-echo",
    status: "Active",
  },
  {
    movieId: "MOV-0002",
    movieName: "Neon Bazaar",
    genre: "Action Thriller",
    language: "Hindi",
    duration: 132,
    rating: 8.1,
    description:
      "A street-smart courier is pulled into a night-long chase across a rain-soaked megacity market run by rival syndicates.",
    poster: "neon-bazaar",
    status: "Active",
  },
  {
    movieId: "MOV-0003",
    movieName: "Monsoon Letters",
    genre: "Romance / Drama",
    language: "Hindi",
    duration: 126,
    rating: 7.9,
    description:
      "Two strangers exchange handwritten letters through a single monsoon season, never once agreeing to meet.",
    poster: "monsoon-letters",
    status: "Active",
  },
  {
    movieId: "MOV-0004",
    movieName: "The Last Signal",
    genre: "Mystery",
    language: "English",
    duration: 118,
    rating: 7.6,
    description:
      "A retired radio engineer investigates a coastal town where every clock stopped at the same minute.",
    poster: "the-last-signal",
    status: "Active",
  },
  {
    movieId: "MOV-0005",
    movieName: "Paper Tigers",
    genre: "Comedy",
    language: "English",
    duration: 104,
    rating: 7.2,
    description:
      "Three interns fake an entire department to save their internship — and accidentally run the company.",
    poster: "paper-tigers",
    status: "Active",
  },
  {
    movieId: "MOV-0006",
    movieName: "Kaal Chakra",
    genre: "Mythological Action",
    language: "Telugu",
    duration: 165,
    rating: 8.4,
    description:
      "A temple guardian inherits a weapon that moves him one day back in time each time it is drawn.",
    poster: "kaal-chakra",
    status: "Active",
  },
  {
    movieId: "MOV-0007",
    movieName: "Deep Blue Silence",
    genre: "Survival Drama",
    language: "English",
    duration: 121,
    rating: 7.8,
    description:
      "A marine biologist is stranded on a research platform as a storm system erases every route home.",
    poster: "deep-blue-silence",
    status: "Active",
  },
  {
    movieId: "MOV-0008",
    movieName: "Starlight Circus",
    genre: "Animation / Family",
    language: "Tamil",
    duration: 96,
    rating: 8.0,
    description:
      "A shy girl joins a travelling circus of constellations and must light the final act herself.",
    poster: "starlight-circus",
    status: "Active",
  },
];

export const SAMPLE_SHOWS: Show[] = [
  ["SHW-0001", "MOV-0001", "PVR Icon", "Screen 1", 0, "10:00", "Standard", 260, 120, 84],
  ["SHW-0002", "MOV-0001", "PVR Icon", "IMAX Screen", 0, "19:30", "Premium", 620, 90, 22],
  ["SHW-0003", "MOV-0002", "INOX Central", "Screen 3", 0, "13:15", "Standard", 220, 150, 96],
  ["SHW-0004", "MOV-0002", "Cinepolis Grand", "Gold Class", 1, "21:00", "Premium", 700, 60, 14],
  ["SHW-0005", "MOV-0003", "Carnival Cinemas", "Screen 2", 1, "11:45", "Standard", 190, 140, 132],
  ["SHW-0006", "MOV-0003", "PVR Icon", "Screen 4", 2, "18:00", "Premium", 540, 80, 45],
  ["SHW-0007", "MOV-0004", "INOX Central", "Screen 1", 1, "16:30", "Standard", 210, 130, 8],
  ["SHW-0008", "MOV-0004", "Cinepolis Grand", "Screen 5", 3, "20:15", "Premium", 580, 70, 61],
  ["SHW-0009", "MOV-0005", "Miraj Multiplex", "Screen 2", 0, "12:30", "Standard", 170, 120, 110],
  ["SHW-0010", "MOV-0006", "Cinepolis Grand", "Screen 1", 0, "17:45", "Standard", 240, 200, 3],
  ["SHW-0011", "MOV-0006", "PVR Icon", "IMAX Screen", 2, "21:30", "Premium", 750, 90, 52],
  ["SHW-0012", "MOV-0007", "Carnival Cinemas", "Screen 3", 2, "14:00", "Standard", 200, 120, 88],
  ["SHW-0013", "MOV-0007", "INOX Central", "Recliner Hall", 4, "19:00", "Premium", 660, 50, 30],
  ["SHW-0014", "MOV-0008", "Miraj Multiplex", "Screen 1", 1, "10:30", "Standard", 150, 160, 140],
  ["SHW-0015", "MOV-0008", "Cinepolis Grand", "Gold Class", 3, "16:00", "Premium", 520, 60, 41],
].map((row) => {
  const [showId, movieId, theatre, screen, offset, showTime, showType, ticketPrice, totalSeats, availableSeats] =
    row as [string, string, string, string, number, string, "Premium" | "Standard", number, number, number];
  const movie = SAMPLE_MOVIES.find((m) => m.movieId === movieId)!;
  return {
    showId,
    movieId,
    movieName: movie.movieName,
    theatre,
    screen,
    showDate: dayOffset(offset),
    showTime,
    showType,
    ticketPrice,
    totalSeats,
    availableSeats,
    status: availableSeats === 0 ? "Housefull" : "Open",
  } satisfies Show;
});

interface SeedBooking {
  requestId: string;
  name: string;
  email: string;
  phone: string;
  showId: string;
  tickets: number;
  status: Booking["bookingStatus"];
  createdHoursAgo: number;
  resolvedHoursAgo?: number;
  bookingId?: string;
}

const SEED_BOOKINGS: SeedBooking[] = [
  {
    requestId: "MTR-0001",
    name: "Ananya Sharma",
    email: "ananya.sharma@example.com",
    phone: "9812345670",
    showId: "SHW-0002",
    tickets: 2,
    status: "Confirmed",
    createdHoursAgo: 30,
    resolvedHoursAgo: 28,
    bookingId: "BKG-0001",
  },
  {
    requestId: "MTR-0002",
    name: "Rahul Verma",
    email: "rahul.verma@example.com",
    phone: "9822233344",
    showId: "SHW-0003",
    tickets: 4,
    status: "Confirmed",
    createdHoursAgo: 20,
    resolvedHoursAgo: 18,
    bookingId: "BKG-0002",
  },
  {
    requestId: "MTR-0003",
    name: "Priya Nair",
    email: "priya.nair@example.com",
    phone: "9700011122",
    showId: "SHW-0006",
    tickets: 3,
    status: "Pending Approval",
    createdHoursAgo: 26,
  },
  {
    requestId: "MTR-0004",
    name: "Imran Qureshi",
    email: "imran.q@example.com",
    phone: "9955512340",
    showId: "SHW-0007",
    tickets: 2,
    status: "Availability Check",
    createdHoursAgo: 55,
  },
  {
    requestId: "MTR-0005",
    name: "Sneha Iyer",
    email: "sneha.iyer@example.com",
    phone: "9844456781",
    showId: "SHW-0011",
    tickets: 5,
    status: "Submitted",
    createdHoursAgo: 4,
  },
  {
    requestId: "MTR-0006",
    name: "Vikram Reddy",
    email: "vikram.reddy@example.com",
    phone: "9666677788",
    showId: "SHW-0010",
    tickets: 6,
    status: "Rejected",
    createdHoursAgo: 40,
    resolvedHoursAgo: 36,
  },
  {
    requestId: "MTR-0007",
    name: "Meera Joshi",
    email: "meera.joshi@example.com",
    phone: "9733344455",
    showId: "SHW-0013",
    tickets: 2,
    status: "Approved",
    createdHoursAgo: 12,
  },
  {
    requestId: "MTR-0008",
    name: "Aditya Kulkarni",
    email: "aditya.k@example.com",
    phone: "9888899900",
    showId: "SHW-0009",
    tickets: 3,
    status: "Cancelled",
    createdHoursAgo: 60,
    resolvedHoursAgo: 50,
  },
  {
    requestId: "MTR-0009",
    name: "Fatima Sheikh",
    email: "fatima.sheikh@example.com",
    phone: "9911122233",
    showId: "SHW-0015",
    tickets: 4,
    status: "Confirmed",
    createdHoursAgo: 8,
    resolvedHoursAgo: 6,
    bookingId: "BKG-0003",
  },
  {
    requestId: "MTR-0010",
    name: "Karthik Menon",
    email: "karthik.menon@example.com",
    phone: "9877766655",
    showId: "SHW-0005",
    tickets: 2,
    status: "Pending Approval",
    createdHoursAgo: 50,
  },
];

export const SAMPLE_BOOKINGS: Booking[] = SEED_BOOKINGS.map((seed) => {
  const show = SAMPLE_SHOWS.find((s) => s.showId === seed.showId)!;
  return {
    requestId: seed.requestId,
    bookingId: seed.bookingId,
    customerName: seed.name,
    customerEmail: seed.email,
    customerPhone: seed.phone,
    movieId: show.movieId,
    movieName: show.movieName,
    showId: show.showId,
    theatre: show.theatre,
    screen: show.screen,
    showDate: show.showDate,
    showTime: show.showTime,
    showType: show.showType,
    numberOfTickets: seed.tickets,
    ticketPrice: show.ticketPrice,
    totalCost: calculateTotalCost(seed.tickets, show.ticketPrice),
    bookingStatus: seed.status,
    stage: stageForStatus(seed.status),
    createdDate: hoursAgo(seed.createdHoursAgo),
    resolvedDate: seed.resolvedHoursAgo ? hoursAgo(seed.resolvedHoursAgo) : undefined,
    assignedQueue: routeByShowType(show.showType),
    confirmationStatus: seed.status === "Confirmed" ? "Sent" : "Not Sent",
  } satisfies Booking;
});
