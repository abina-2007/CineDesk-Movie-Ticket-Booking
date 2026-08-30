import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Clock, Languages, MapPin, Star, Ticket } from "lucide-react";
import { PosterImage } from "@/components/MovieCard";
import { EmptyState } from "@/components/EmptyState";
import { Pill, ShowTypeBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { formatCurrency, formatDate, formatTime } from "@/lib/booking-logic";

export const Route = createFileRoute("/movies/$movieId")({
  head: () => ({
    meta: [
      { title: "Movie Details — CineDesk Booking Management" },
      {
        name: "description",
        content: "Full movie information with all scheduled Premium and Standard shows, seat availability and pricing.",
      },
      { property: "og:title", content: "Movie Details — CineDesk" },
      { property: "og:description", content: "See show timings, theatres, ticket price and available seats." },
    ],
  }),
  component: MovieDetails,
});

function MovieDetails() {
  const { movieId } = Route.useParams();
  const { getMovie, showsForMovie } = useStore();
  const navigate = useNavigate();
  const movie = getMovie(movieId);

  if (!movie) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Movie not found"
          description="This movie may have been removed from the catalogue."
          action={
            <Button asChild variant="outline">
              <Link to="/movies">Back to catalogue</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const shows = showsForMovie(movie.movieId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/movies">
          <ArrowLeft className="size-4" /> Back to catalogue
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="surface-panel overflow-hidden">
          <PosterImage movie={movie} className="aspect-[2/3] w-full object-cover" eager />
        </div>

        <div className="surface-panel p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="gold">
              <Star className="size-3 fill-current" /> {movie.rating.toFixed(1)} / 10
            </Pill>
            <Pill tone={movie.status === "Active" ? "success" : "danger"}>{movie.status}</Pill>
            <Pill>{movie.movieId}</Pill>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{movie.movieName}</h1>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Ticket className="size-4" /> {movie.genre}
            </span>
            <span className="flex items-center gap-1.5">
              <Languages className="size-4" /> {movie.language}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" /> {movie.duration} minutes
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-foreground/90">{movie.description}</p>

          <h2 className="mt-8 flex items-center gap-2 text-lg font-semibold">
            <CalendarDays className="size-5 text-primary" /> Available shows
          </h2>

          {shows.length === 0 ? (
            <p className="mt-3 rounded-lg border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
              No shows are currently scheduled for this movie.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {shows.map((show) => {
                const soldOut = show.availableSeats <= 0;
                return (
                  <div key={show.showId} className="rounded-xl border border-border bg-secondary/30 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="flex items-center gap-1.5 text-sm font-semibold">
                          <MapPin className="size-3.5 text-primary" /> {show.theatre}
                        </p>
                        <p className="text-xs text-muted-foreground">{show.screen}</p>
                      </div>
                      <ShowTypeBadge type={show.showType} />
                    </div>
                    <p className="mt-3 text-sm">
                      {formatDate(show.showDate)} · <span className="font-semibold">{formatTime(show.showTime)}</span>
                    </p>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatCurrency(show.ticketPrice)} / ticket</span>
                      <span className={soldOut ? "text-destructive" : "text-success"}>
                        {show.availableSeats} / {show.totalSeats} seats
                      </span>
                    </div>
                    <Button
                      className="mt-3 w-full"
                      size="sm"
                      disabled={soldOut}
                      onClick={() =>
                        navigate({ to: "/book", search: { movieId: movie.movieId, showId: show.showId } })
                      }
                    >
                      {soldOut ? "Housefull" : "Book this show"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
