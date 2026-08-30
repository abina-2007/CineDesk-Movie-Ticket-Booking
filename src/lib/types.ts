export type ShowType = "Premium" | "Standard";

export type MovieStatus = "Active" | "Inactive";
export type ShowStatus = "Open" | "Housefull" | "Cancelled";

export type BookingStatus =
  | "Draft"
  | "Submitted"
  | "Availability Check"
  | "Pending Approval"
  | "Approved"
  | "Booking Processing"
  | "Confirmed"
  | "Rejected"
  | "Cancelled";

export type Stage = "Initial" | "Availability" | "Approval" | "Booking Execution";

export const STAGES: Stage[] = ["Initial", "Availability", "Approval", "Booking Execution"];

export type SlaStatus = "Within SLA" | "Approaching Deadline" | "SLA Breached" | "Completed";

export interface Movie {
  movieId: string;
  movieName: string;
  genre: string;
  language: string;
  duration: number; // minutes
  rating: number; // 0 - 10
  description: string;
  poster: string; // poster key or URL
  status: MovieStatus;
}

export interface Show {
  showId: string;
  movieId: string;
  movieName: string;
  theatre: string;
  screen: string;
  showDate: string; // yyyy-mm-dd
  showTime: string; // HH:mm
  showType: ShowType;
  ticketPrice: number;
  totalSeats: number;
  availableSeats: number;
  status: ShowStatus;
}

export interface Booking {
  requestId: string;
  bookingId?: string | undefined;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  movieId: string;
  movieName: string;
  showId: string;
  theatre: string;
  screen: string;
  showDate: string;
  showTime: string;
  showType: ShowType;
  numberOfTickets: number;
  ticketPrice: number;
  totalCost: number;
  bookingStatus: BookingStatus;
  stage: Stage;
  createdDate: string; // ISO
  resolvedDate?: string | undefined; // ISO
  assignedQueue: string;
  confirmationStatus: "Not Sent" | "Sent";
  notes?: string | undefined;
}
