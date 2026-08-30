import { z } from "zod";

export const bookingRequestSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(3, { message: "Customer name must be at least 3 characters" })
    .max(80, { message: "Customer name must be less than 80 characters" }),
  customerEmail: z
    .string()
    .trim()
    .min(1, { message: "Email is required" })
    .email({ message: "Enter a valid email address" })
    .max(120),
  customerPhone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, { message: "Enter a valid 10-digit phone number" }),
  movieId: z.string().min(1, { message: "Please select a movie" }),
  showId: z.string().min(1, { message: "Please select a show" }),
  numberOfTickets: z
    .number({ invalid_type_error: "Number of tickets is required" })
    .int({ message: "Tickets must be a whole number" })
    .min(1, { message: "Number of tickets must be at least 1" })
    .max(10, { message: "Maximum 10 tickets per booking" }),
});

export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;

export const movieSchema = z.object({
  movieName: z.string().trim().min(2, { message: "Movie name is required" }).max(80),
  genre: z.string().trim().min(2, { message: "Genre is required" }).max(40),
  language: z.string().trim().min(2, { message: "Language is required" }).max(30),
  duration: z.number().min(30, { message: "Duration must be at least 30 minutes" }).max(300),
  rating: z.number().min(0).max(10),
  description: z.string().trim().min(10, { message: "Description must be at least 10 characters" }).max(600),
  status: z.enum(["Active", "Inactive"]),
});

export const showSchema = z.object({
  movieId: z.string().min(1, { message: "Please select a movie" }),
  theatre: z.string().trim().min(2, { message: "Theatre is required" }).max(60),
  screen: z.string().trim().min(1, { message: "Screen is required" }).max(30),
  showDate: z.string().min(1, { message: "Show date is required" }),
  showTime: z.string().min(1, { message: "Show time is required" }),
  showType: z.enum(["Premium", "Standard"]),
  ticketPrice: z.number().min(1, { message: "Ticket price must be greater than 0" }).max(5000),
  totalSeats: z.number().int().min(1, { message: "Total seats must be at least 1" }).max(500),
  availableSeats: z.number().int().min(0, { message: "Available seats cannot be negative" }).max(500),
  status: z.enum(["Open", "Housefull", "Cancelled"]),
});

export function firstError(error: unknown): string {
  if (error instanceof z.ZodError) return error.errors[0]?.message ?? "Invalid input";
  return "Invalid input";
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.errors) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
